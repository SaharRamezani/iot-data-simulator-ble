# IoT Data Simulator - Bluetooth Edition

A Bluetooth-based simulator for transmitting IoT sensor data such as heart rate, respiration, acceleration, and position data. Designed to connect to paired mobile devices via Bluetooth and send sensor measurements in JSON format.

## Setup

The program uses environment variables to configure the Bluetooth connection:

```bash
# Option 1: Connect by MAC address
BLUETOOTH_DEVICE_ADDRESS=XX:XX:XX:XX:XX:XX

# Option 2: Connect by device name (partial match)
BLUETOOTH_DEVICE_NAME=MyPhone

# Data folder location
DATA_FOLDER=data
```

### Prerequisites

1. **Bluetooth must be enabled** on your Linux laptop
2. **Mobile device must be paired** with your laptop
3. **bluetoothctl** and related Bluetooth tools must be available

### Configuration

1. Create a `.env` file in the root directory
2. Copy the contents from `.env.example` and update with your mobile device's information
3. You can find your paired devices using: `bluetoothctl devices Paired`

### Installation and Usage

1. Install the dependencies: `npm install`
2. Make sure your mobile device is paired and discoverable
3. Run the simulator: `npm start`

## Features

- **Automatic device discovery**: Lists all paired Bluetooth devices
- **Flexible connection**: Connect by MAC address or device name
- **Real-time data transmission**: Sends sensor data with original timestamps
- **Multiple sensor types**: Heart rate, respiration, acceleration (X, Y, Z), and position
- **JSON format**: Data is sent as JSON strings matching the original format

## Data Format

Each measurement is sent as a JSON object:

```json
{
  "date": 1691059124,
  "value": [59],
  "userId": 1001,
  "measureType": "HeartRate"
}
```

## Troubleshooting

- If connection fails, ensure the device is paired: `bluetoothctl pair XX:XX:XX:XX:XX:XX`
- Check if Bluetooth service is running: `sudo systemctl status bluetooth`
- For permission issues, you may need to run with sudo for RFCOMM operations