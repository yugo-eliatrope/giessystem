import { SerialPort } from 'serialport';

import { ILogger } from './logger';
import { parseSerialData } from './parser';
import { isUnsavedSensorReading } from './domain';
import { EventBus } from './event-bus';

export type SerialManagerConfig = {
  path: string;
  baudRate: number;
};

export class SerialManager {
  private port: SerialPort;

  constructor(
    config: SerialManagerConfig,
    private readonly logger: ILogger,
    private readonly eventBus: EventBus,
  ) {
    const { path, baudRate } = config;

    this.port = new SerialPort({ path, baudRate });

    this.port.on('open', () => {
      this.logger.info(`Serial port ${path} opened at ${baudRate} baud rate`);
    });

    this.port.on('data', (data: Buffer) => {
      const parsedData = parseSerialData(data);
      if (isUnsavedSensorReading(parsedData)) {
        this.logger.info(`Sensor data: ${parsedData.temperature}°C, ${parsedData.humidity}%`);
        this.eventBus.emit('sensor:data', parsedData);
      } else if (parsedData.message) {
        this.logger.info(parsedData.message);
      }
    });

    this.port.on('error', (err) => {
      this.logger.error(`Serial port error: ${err.message}`);
    });
  }

  public write = (data: string | Buffer) => {
    this.logger.info(`Writing data to serial port: ${data}`);
    this.port.write(`${data}\n`, (err) => {
      if (err) {
        this.logger.error(`Error writing to serial port: ${err.message}`);
      } else {
        this.logger.info(`Data written to serial port: ${data}`);
      }
    });
  };

  public close = () => {
    this.port.close((err) => {
      if (err) {
        this.logger.error(`Error closing serial port: ${err.message}`);
      } else {
        this.logger.info('Serial port closed');
      }
    });
  };
}
