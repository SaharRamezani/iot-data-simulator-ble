import { readFile } from 'fs/promises';
import path from 'path';
import type {
  Measurement,
  MeasurementType,
  DataGroup,
  UserDataArray,
} from './types';
import { MeasurementTypeEnum } from './types';
import { Bluetooth } from './bluetooth';

const dataFolder = process.env.DATA_FOLDER || 'data';

/**
 * Read user data from a JSON file.
 *
 * @returns {Promise<UserDataArray>} Returns a promise that resolves to an array of UserData objects.
 */
async function readUserData(): Promise<UserDataArray> {
  const user1 = path.join(dataFolder, 'user1.json');
  const dataString = await readFile(user1, 'utf8');
  try {
    return JSON.parse(dataString);
  } catch (err: unknown) {
    console.error('Failed to parse user data JSON.', err);
    throw new Error('Failed to parse user data JSON');
  }
}

/**
 * Flatten the user data into a single array of Measurement objects.
 *
 * @param data the user data to flatten
 * @returns a flat array of Measurement objects
 */
function flatMeasurementData(data: UserDataArray): Measurement[] {
  return data.map((d) => d.data).flat();
}

/**
 * Groups measurements by their timestamp into an MqttMessage format.
 *
 * @param measurements the measurements to group by timestamp
 * @returns a Map where the key is the timestamp and the value is an MqttMessage object
 */
function groupMeasurementsByTimestamp(
  measurements: Measurement[],
): Map<number, DataGroup> {
  const group = new Map();
  for (const measurement of measurements) {
    const mt = measurement.measureType;
    if (ignoreMeasurementType(mt)) {
      continue;
    }
    const timestamp = measurement.date;
    if (!group.has(timestamp)) {
      group.set(timestamp, {
        timestamp,
        userId: measurement.userId,
      });
    }
    const measureKey: string =
      MeasurementTypeEnum[mt as keyof typeof MeasurementTypeEnum];

    if (measureKey) {
      group.get(timestamp)[measureKey] = measurement.value;
    }
  }
  return group;
}

/**
 *  Check if the measurement type is valid.
 *
 * @param measureType the measurement type to validate
 * @returns
 */
function ignoreMeasurementType(measureType: MeasurementType) {
  return measureType === 'R2R' || measureType === 'ECG';
}

/**
 * Prepare and send messages to the Bluetooth device.
 *
 * @param data a Map of timestamps to DataGroup objects
 * @param bluetoothClient the Bluetooth client to use for sending messages
 * @param abortSignal an AbortSignal to allow graceful shutdown
 */
async function prepareAndSendMessages(
  data: Map<number, DataGroup>,
  bluetoothClient: Bluetooth,
  abortSignal: AbortSignal,
) {
  const sortedTimestamps = Array.from(data.keys()).sort((a, b) => a - b);
  const timeDeltas = sortedTimestamps
    .slice(1)
    .map((key, i) => key - sortedTimestamps[i]);

  for (let i = 0; i < sortedTimestamps.length; i++) {
    if (abortSignal.aborted) {
      break;
    }

    const timestamp = sortedTimestamps[i];
    const datum = data.get(timestamp);
    if (!datum) {
      continue;
    }
    
    if (datum.heartRate) {
      const msg: Measurement = {
        date: Date.now(),
        value: datum.heartRate,
        userId: datum.userId,
        measureType: 'HeartRate',
      };
      await bluetoothClient.sendMessage(JSON.stringify(msg));
    }
    if (datum.breathFrequency) {
      const msg: Measurement = {
        date: Date.now(),
        value: datum.breathFrequency,
        userId: datum.userId,
        measureType: 'BreathFrequency',
      };
      await bluetoothClient.sendMessage(JSON.stringify(msg));
    }
    if (datum.respiration) {
      const msg: Measurement = {
        date: Date.now(),
        value: datum.respiration,
        userId: datum.userId,
        measureType: 'Respiration',
      };
      await bluetoothClient.sendMessage(JSON.stringify(msg));
    }
    if (datum.accelerationX) {
      const msg: Measurement = {
        date: Date.now(),
        value: datum.accelerationX,
        userId: datum.userId,
        measureType: 'AccelerationX',
      };
      await bluetoothClient.sendMessage(JSON.stringify(msg));
    }
    if (datum.accelerationY) {
      const msg: Measurement = {
        date: Date.now(),
        value: datum.accelerationY,
        userId: datum.userId,
        measureType: 'AccelerationY',
      };
      await bluetoothClient.sendMessage(JSON.stringify(msg));
    }
    if (datum.accelerationZ) {
      const msg: Measurement = {
        date: Date.now(),
        value: datum.accelerationZ,
        userId: datum.userId,
        measureType: 'AccelerationZ',
      };
      await bluetoothClient.sendMessage(JSON.stringify(msg));
    }
    if (datum.position) {
      const msg: Measurement = {
        date: Date.now(),
        value: datum.position,
        userId: datum.userId,
        measureType: 'Position',
      };
      await bluetoothClient.sendMessage(JSON.stringify(msg));
    }

    await waitDelta(i, timeDeltas);
    console.log('');
  }
}

/**
 * Wait for a specified time delta before proceeding.
 *
 * @param i the current index in the timeDeltas array
 * @param timeDeltas  an array of time deltas in seconds
 */
async function waitDelta(i: number, timeDeltas: number[]) {
  if (i < timeDeltas.length) {
    const delay = timeDeltas[i];
    await new Promise((res) => setTimeout(res, delay * 1000));
  }
}

/**
 * Main function to initialize the Bluetooth client and send messages.
 *
 * @param abortSignal an AbortSignal to allow graceful shutdown
 * @returns a cleanup function to close the Bluetooth connection gracefully
 */
export default async function main(
  abortSignal: AbortSignal,
): Promise<() => Promise<void>> {
  const data = await readUserData();
  const groupedData = groupMeasurementsByTimestamp(flatMeasurementData(data));

  const bluetoothClient = new Bluetooth();
  await bluetoothClient.startConnection();

  // don't await here, let the messages be sent asynchronously
  prepareAndSendMessages(groupedData, bluetoothClient, abortSignal);

  return async () => {
    await bluetoothClient.closeConnection();
  };
}
