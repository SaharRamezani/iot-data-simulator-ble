# Usage Examples

## 1. Discover Your Paired Devices

Before running the simulator, discover your paired Bluetooth devices:

```bash
./discover-devices.sh
```

This will show output like:
```
✅ Found paired devices:
   📱 MyPhone (XX:XX:XX:XX:XX:XX)
   📱 MyTablet (YY:YY:YY:YY:YY:YY)
```

## 2. Configure Your Environment

Create a `.env` file with your device information:

```bash
# Copy the example file
cp .env.example .env

# Edit with your device info
nano .env
```

Example `.env` content:
```
# Connect to phone by address
BLUETOOTH_DEVICE_ADDRESS=FC:02:96:04:33:AB

# Or connect by name (phone will be found by partial name match)
BLUETOOTH_DEVICE_NAME=Xiaomi

# Data folder
DATA_FOLDER=data
```

## 3. Run the Simulator

```bash
npm start
```

## 4. Expected Output

When running successfully, you should see:
```
Discovering paired Bluetooth devices...
Found paired devices: [...]
Connecting to Bluetooth device: MyPhone (XX:XX:XX:XX:XX:XX)
Bluetooth connection established
Sending via Bluetooth: {"date":1691059124,"value":[59],"userId":1001,"measureType":"HeartRate"}
Message sent successfully via Bluetooth
...
```

## 5. Data Received on Mobile

Your mobile application should receive JSON messages like:

```json
{"date":1691059124,"value":[59],"userId":1001,"measureType":"HeartRate"}
{"date":1691059124,"value":[18],"userId":1001,"measureType":"BreathFrequency"}
{"date":1691059125,"value":[1.2,0.8,-0.3],"userId":1001,"measureType":"AccelerationX"}
```

## 6. Troubleshooting

### Device Not Found
```bash
# Check if device is paired
bluetoothctl devices Paired

# If not listed, pair it
bluetoothctl
> scan on
> pair XX:XX:XX:XX:XX:XX
> trust XX:XX:XX:XX:XX:XX
> exit
```

### Permission Issues
```bash
# Add your user to bluetooth group
sudo usermod -a -G bluetooth $USER

# Restart your session or run:
sudo systemctl restart bluetooth
```

### Connection Failed
```bash
# Check Bluetooth service
sudo systemctl status bluetooth

# Restart if needed
sudo systemctl restart bluetooth
```
