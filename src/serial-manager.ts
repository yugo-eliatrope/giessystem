import { SerialPort } from 'serialport';
import { Logger } from './logger';
import { parseSerialData } from './parser';

const logger = new Logger('SerialManager');

export class SerialManager {
  private port: SerialPort;

  constructor(
    path: string,
    baudRate: number,
    onData: (t: number, h: number) => void
  ) {
    this.port = new SerialPort({ path, baudRate });

    this.port.on('open', () => {
      logger.info(`Serial port ${path} opened at ${baudRate} baud rate`);
    });

    this.port.on('data', (data: Buffer) => {
      const parsedData = parseSerialData(data);
      logger.info(parsedData);
      if (typeof parsedData === 'object') {
        onData(parsedData.temperature, parsedData.humidity);
      }
    });

    this.port.on('error', (err) => {
      logger.error(`Serial port error: ${err.message}`);
    });
  }

  public write(data: string | Buffer) {
    this.port.write(data + '\n', (err) => {
      if (err) {
        logger.error(`Error writing to serial port: ${err.message}`);
      } else {
        logger.info(`Data written to serial port: ${data}`);
      }
    });
  }

  public close() {
    this.port.close((err) => {
      if (err) {
        logger.error(`Error closing serial port: ${err.message}`);
      } else {
        logger.info('Serial port closed');
      }
    });
  }
}
