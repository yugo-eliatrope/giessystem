import { ParsedData } from './types';

const SENSOR_DATA_REGEX = /^t:(-?\d+(?:\.\d+)?),\sh:(-?\d+(?:\.\d+)?)$/;

export const parseSerialData = (data: Buffer): ParsedData => {
  const str = data.toString().replace(/\r|\n/g, '');
  const match = str.match(SENSOR_DATA_REGEX);

  if (!match) {
    return str;
  }

  return {
    temperature: Number.parseFloat(match[1]),
    humidity: Number.parseFloat(match[2]),
  };
};
