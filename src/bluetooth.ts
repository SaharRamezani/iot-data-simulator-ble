import { spawn, exec } from 'child_process';
import * as fs from 'fs';

export class Bluetooth {
  private deviceAddress = process.env.BLUETOOTH_DEVICE_ADDRESS || '';
  private rfcommProc: ReturnType<typeof spawn> | null = null;
  private rfcommFd: number | null = null;

  async startConnection(deviceIdentifier?: string): Promise<void> {
    const addr = await this.resolveAddress(deviceIdentifier || this.deviceAddress);
    this.deviceAddress = addr;
    await this.ensurePaired(addr); // optional: bluetoothctl connect
    await this.connectRFCOMM(addr); // opens /dev/rfcomm0 on the right channel
  }

  async sendMessage(message: string): Promise<void> {
    if (this.rfcommFd == null) throw new Error('RFCOMM not connected');
    const line = message.endsWith('\n') ? message : message + '\n';
    await new Promise<void>((res, rej) =>
      fs.write(this.rfcommFd!, Buffer.from(line, 'utf8'), (e) => (e ? rej(e) : res())),
    );
  }

  async closeConnection(): Promise<void> {
    if (this.rfcommFd != null) {
      try { fs.closeSync(this.rfcommFd); } catch {}
      this.rfcommFd = null;
    }
  await new Promise<void>((resolve) => { exec('rfcomm release 0', () => resolve()); }).catch(() => {});
    if (this.rfcommProc) { try { this.rfcommProc.kill('SIGINT'); } catch {} this.rfcommProc = null; }
  }

  // --- helpers ---

  private async resolveAddress(nameOrAddr: string): Promise<string> {
    if (/^[0-9A-F:]{17}$/i.test(nameOrAddr)) return nameOrAddr;
    const { stdout } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      exec('bluetoothctl devices Paired', (err, stdout, stderr) => err ? reject(err) : resolve({ stdout, stderr }));
    });
    for (const line of stdout.split('\n')) {
      const m = line.match(/Device ([A-Fa-f0-9:]{17}) (.+)/);
      if (m && m[2].toLowerCase().includes(nameOrAddr.toLowerCase())) return m[1];
    }
    throw new Error(`Paired device not found: ${nameOrAddr}`);
  }

  private async ensurePaired(addr: string) {
    await new Promise<void>((resolve) => { exec(`bluetoothctl connect ${addr}`, () => resolve()); }).catch(() => {});
  }

  private async connectRFCOMM(addr: string): Promise<void> {
    // First try the known RFCOMM channels from sdptool browse
    const knownChannels = [12, 19, 26, 3, 2]; // OBEX, Phonebook, SMS, Handsfree, Headset
    
    console.log(`Attempting to connect to ${addr}...`);
    
    for (const ch of knownChannels) {
      console.log(`Trying channel ${ch}...`);
      await new Promise<void>((resolve) => { exec('rfcomm release 0', () => resolve()); }).catch(() => {});

      const p = spawn('rfcomm', ['connect', 'rfcomm0', addr, String(ch)]);

      const ok = await new Promise<boolean>((resolve) => {
        let resolved = false;
        const to = setTimeout(() => {
          if (!resolved) { resolved = true; resolve(false); try { p.kill('SIGINT'); } catch {} }
        }, 4000);

        p.stdout.on('data', (d: Buffer) => {
          const s = d.toString();
          console.log(`Channel ${ch}: ${s.trim()}`);
          if (!resolved && (/Connected .* on channel/.test(s) || /Connection successful/i.test(s))) { 
            clearTimeout(to); resolved = true; resolve(true); 
          }
        });
        p.stderr.on('data', (d: Buffer) => {
          console.log(`Channel ${ch} stderr: ${d.toString().trim()}`);
        });
        p.on('exit', (code) => { 
          console.log(`Channel ${ch} exited with code ${code}`);
          if (!resolved) resolve(false); 
        });
      });

      if (ok) {
        this.rfcommProc = p;
        this.rfcommFd = fs.openSync('/dev/rfcomm0', 'w');
        console.log(`✅ RFCOMM up on channel ${ch}`);
        return;
      }
    }
    
    console.log('All known channels failed. Make sure your Kotlin app is running and has created a BluetoothServerSocket with SPP UUID.');
    throw new Error('Failed to open RFCOMM on any available channel. Your mobile app needs to be running first.');
  }
}
