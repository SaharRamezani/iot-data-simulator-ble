#!/bin/bash

echo "=== Bluetooth Connection Diagnostic ==="
echo

PHONE_ADDR="FC:02:96:04:33:AB"

echo "1. Checking if phone is connected..."
if bluetoothctl info $PHONE_ADDR | grep -q "Connected: yes"; then
    echo "✅ Phone is connected"
else
    echo "❌ Phone is not connected"
    echo "Run: bluetoothctl connect $PHONE_ADDR"
fi

echo
echo "2. Checking available RFCOMM services..."
echo "📱 Available RFCOMM channels:"
sdptool browse $PHONE_ADDR | grep -A 2 "RFCOMM" | grep "Channel:" | while read line; do
    channel=$(echo $line | grep -o 'Channel: [0-9]*' | grep -o '[0-9]*')
    echo "   Channel $channel"
done

echo
echo "3. Looking for Serial Port Profile (SPP)..."
if sdptool browse $PHONE_ADDR | grep -q "Serial Port"; then
    echo "✅ SPP service found"
    SPP_CHANNEL=$(sdptool browse $PHONE_ADDR | grep -A 2 "Serial Port" | grep "Channel:" | grep -o '[0-9]*')
    echo "   SPP Channel: $SPP_CHANNEL"
else
    echo "❌ No SPP service found"
    echo "   Your Kotlin app must be running and listening on BluetoothServerSocket"
    echo "   with UUID: 00001101-0000-1000-8000-00805F9B34FB"
fi

echo
echo "4. Testing rfcomm availability..."
if which rfcomm > /dev/null; then
    echo "✅ rfcomm command available"
    echo "   Current rfcomm devices:"
    rfcomm show || echo "   None"
else
    echo "❌ rfcomm not found. Install: sudo apt install bluez-utils"
fi

echo
echo "5. Checking dialout group membership..."
if groups | grep -q dialout; then
    echo "✅ User is in dialout group (can write to /dev/rfcomm0)"
else
    echo "⚠️  User not in dialout group. Add with:"
    echo "   sudo usermod -aG dialout \$USER"
    echo "   Then log out and back in"
fi

echo
echo "📋 Next steps:"
echo "1. Make sure your Kotlin Bluetooth server app is running on your phone"
echo "2. Re-run this diagnostic to see if SPP service appears"
echo "3. Run: npm start"
