#!/bin/bash

echo "=== Bluetooth Device Discovery ==="
echo

# Check if bluetoothctl is available
if ! command -v bluetoothctl &> /dev/null; then
    echo "❌ bluetoothctl not found. Please install bluez package:"
    echo "   sudo apt install bluez"
    exit 1
fi

# Check if Bluetooth service is running
if ! systemctl is-active --quiet bluetooth; then
    echo "❌ Bluetooth service is not running. Starting it..."
    sudo systemctl start bluetooth
fi

echo "🔍 Scanning for paired devices..."
echo

# List paired devices
PAIRED_DEVICES=$(bluetoothctl devices Paired)

if [ -z "$PAIRED_DEVICES" ]; then
    echo "❌ No paired devices found."
    echo "   To pair a device:"
    echo "   1. Make your mobile device discoverable"
    echo "   2. Run: bluetoothctl"
    echo "   3. In bluetoothctl prompt:"
    echo "      scan on"
    echo "      pair XX:XX:XX:XX:XX:XX"
    echo "      trust XX:XX:XX:XX:XX:XX"
    echo "      connect XX:XX:XX:XX:XX:XX"
else
    echo "✅ Found paired devices:"
    echo "$PAIRED_DEVICES" | while read line; do
        if [[ $line == Device* ]]; then
            address=$(echo $line | cut -d' ' -f2)
            name=$(echo $line | cut -d' ' -f3-)
            echo "   📱 $name ($address)"
        fi
    done
    
    echo
    echo "💡 To use in your .env file:"
    echo "   BLUETOOTH_DEVICE_ADDRESS=XX:XX:XX:XX:XX:XX"
    echo "   # or"
    echo "   BLUETOOTH_DEVICE_NAME=DeviceName"
fi

echo
echo "🔍 Current Bluetooth status:"
bluetoothctl show | grep -E "(Name:|Powered:|Discoverable:|Pairable:)"
