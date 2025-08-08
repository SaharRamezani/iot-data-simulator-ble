import { Bluetooth } from './src/bluetooth';

async function testBluetooth() {
  const bluetooth = new Bluetooth();
  
  try {
    console.log('Testing Bluetooth functionality...');
    
    // Test device discovery
    const devices = await bluetooth.discoverPairedDevices();
    console.log(`Found ${devices.length} paired devices`);
    
    if (devices.length > 0) {
      console.log('Testing connection to first device...');
      try {
        await bluetooth.startConnection(devices[0].address);
        console.log('✅ Connection test successful');
        
        // Test sending a message
        await bluetooth.sendMessage('{"test": "message"}');
        console.log('✅ Message test successful');
        
        await bluetooth.closeConnection();
        console.log('✅ Disconnection test successful');
      } catch (connectionError) {
        console.log('⚠️  Connection test failed (expected if device not ready):', connectionError instanceof Error ? connectionError.message : connectionError);
      }
    } else {
      console.log('⚠️  No paired devices found. Use ./discover-devices.sh to check your setup.');
    }
    
    console.log('✅ Bluetooth class test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBluetooth();
