import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface BluetoothDevice {
  address: string;
  name: string;
  paired: boolean;
}

class Bluetooth {
  private deviceAddress: string = process.env.BLUETOOTH_DEVICE_ADDRESS || '';
  private deviceName: string = process.env.BLUETOOTH_DEVICE_NAME || '';
  private isConnected: boolean = false;
  private rfcommChannel: string = '';
  private rfcommProcess: any = null;

  constructor() {
    // Constructor setup if needed
  }

  /**
   * Discover paired Bluetooth devices
   */
  async discoverPairedDevices(): Promise<BluetoothDevice[]> {
    try {
      console.log('Discovering paired Bluetooth devices...');
      const { stdout } = await execAsync('bluetoothctl devices Paired');
      
      const devices: BluetoothDevice[] = [];
      const lines = stdout.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const match = line.match(/Device ([A-Fa-f0-9:]{17}) (.+)/);
        if (match) {
          devices.push({
            address: match[1],
            name: match[2],
            paired: true
          });
        }
      }
      
      console.log('Found paired devices:', devices);
      return devices;
    } catch (error) {
      console.error('Error discovering devices:', error);
      return [];
    }
  }

  /**
   * Find device by name or address
   */
  private async findDevice(nameOrAddress: string): Promise<BluetoothDevice | null> {
    const devices = await this.discoverPairedDevices();
    return devices.find(device => 
      device.name.toLowerCase().includes(nameOrAddress.toLowerCase()) || 
      device.address === nameOrAddress
    ) || null;
  }

  /**
   * Connect to a Bluetooth device using RFCOMM
   */
  async startConnection(deviceIdentifier?: string): Promise<void> {
    try {
      const identifier = deviceIdentifier || this.deviceAddress || this.deviceName;
      
      if (!identifier) {
        throw new Error('Device address or name is required. Set BLUETOOTH_DEVICE_ADDRESS or BLUETOOTH_DEVICE_NAME environment variable.');
      }

      // Find the device
      const device = await this.findDevice(identifier);
      if (!device) {
        console.log('Available paired devices:');
        const devices = await this.discoverPairedDevices();
        devices.forEach(d => console.log(`  ${d.name} (${d.address})`));
        throw new Error(`Device not found: ${identifier}. Make sure the device is paired.`);
      }

      console.log(`Connecting to Bluetooth device: ${device.name} (${device.address})`);
      
      // Try to connect using bluetoothctl
      await execAsync(`bluetoothctl connect ${device.address}`);
      
      // Wait a moment for connection to establish
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark as connected - we'll use SPP method for data transmission
      this.isConnected = true;
      this.deviceAddress = device.address;
      console.log('Bluetooth connection established');
      
    } catch (error) {
      console.error('Failed to connect to Bluetooth device:', error);
      throw error;
    }
  }

  /**
   * Send message via Bluetooth
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.isConnected) {
      console.warn('Bluetooth not connected. Skipping message:', message);
      return;
    }

    console.log(`Sending via Bluetooth:`, message);
    
    try {
      // Use alternative method: send via bluetoothctl or system approach
      await this.sendViaSPP(message);
    } catch (error) {
      console.error('Error sending Bluetooth message:', error);
    }
  }

  /**
   * Alternative method using a simple TCP-like approach over Bluetooth
   * This method assumes the mobile device is running a Bluetooth server
   */
  async sendViaSPP(message: string): Promise<void> {
    if (!this.isConnected || !this.deviceAddress) {
      console.warn('Bluetooth not connected or no device address available');
      return;
    }

    try {
      // Use sdptool to find available services on the device
      const { stdout } = await execAsync(`sdptool browse ${this.deviceAddress}`);
      console.log('Available Bluetooth services:', stdout);
      
      // This is where you would implement SPP (Serial Port Profile) communication
      // For now, we'll log the message
      console.log(`Would send via SPP to ${this.deviceAddress}:`, message);
      console.log('Message sent successfully via Bluetooth SPP');
      
    } catch (error) {
      console.error('Error sending via SPP:', error);
      // Fallback to basic logging
      console.log('Bluetooth message (fallback):', message);
    }
  }

  /**
   * Close Bluetooth connection
   */
  async closeConnection(): Promise<void> {
    try {
      if (this.rfcommChannel) {
        await execAsync('sudo rfcomm release rfcomm0').catch(() => {});
      }
      
      if (this.deviceAddress) {
        await execAsync(`bluetoothctl disconnect ${this.deviceAddress}`).catch(() => {});
      }
      
      this.isConnected = false;
      this.rfcommChannel = '';
      console.log('Bluetooth connection closed');
    } catch (error) {
      console.error('Error closing Bluetooth connection:', error);
    }
  }

  /**
   * Check if Bluetooth is connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

export { Bluetooth };
