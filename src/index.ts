import process from 'process';

import { config } from './config';
import { Logger } from './logger';
import { SerialManager } from './serial-manager';
import { Server } from './server';
import { StoreManager } from './store';

const logger = new Logger('GiesSystem');

const store = new StoreManager(config.app.maxLogMessages);
const serial = new SerialManager(config.serial.path, config.serial.baudRate, (t, h) => store.update(t, h));
const server = new Server(
  config.server.port,
  (data: string) => serial.write(data),
  () => store.data
);

server.start();

process.on('SIGINT', () => {
  logger.info('Shutting down...');
  serial.close();
  process.exit(0);
});
