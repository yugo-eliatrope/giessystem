import { SerialPort } from 'serialport';

import { ILogger } from './logger';
import { parseSerialData } from './parser';

export type SerialManagerDeps = {
  logger: ILogger;
};

export type SerialManagerConfig = {
  path: string;
  baudRate: number;
};

export class SerialManager {
  private port: SerialPort;
  private logger: ILogger;

  constructor(
    config: SerialManagerConfig,
    deps: SerialManagerDeps,
    private readonly onData: (t: number, h: number) => void
  ) {
    this.logger = deps.logger;
    const { path, baudRate } = config;

    this.port = new SerialPort({ path, baudRate });

    this.port.on('open', () => {
      this.logger.info(`Serial port ${path} opened at ${baudRate} baud rate`);
    });

    this.port.on('data', (data: Buffer) => {
      const parsedData = parseSerialData(data);
      if (typeof parsedData === 'object') {
        this.logger.info(`Sensor data: ${parsedData.temperature}°C, ${parsedData.humidity}%`);
        this.onData(parsedData.temperature, parsedData.humidity);
      } else {
        parsedData && this.logger.info(parsedData);
      }
    });

    this.port.on('error', (err) => {
      this.logger.error(`Serial port error: ${err.message}`);
    });
  }

  public write = (data: string | Buffer) => {
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
