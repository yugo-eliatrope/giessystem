import fs from 'fs';
import path from 'path';
import process from 'process';

import { config } from './config';
import { Logger } from './logger';
import { SerialManager } from './serial-manager';
import { Server } from './server';
import { StoreManager } from './store';

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf-8');

const logger = new Logger();
const store = new StoreManager(config.app.maxLogMessages);

const serial = new SerialManager(config.serial, { logger: logger.child('Serial') }, (t, h) => store.update(t, h));

const server = new Server(
  config.server,
  { onWrite: (data) => serial.write(data), getData: () => store.data },
  { logger: logger.child('Server'), indexHtml }
);

server.start();

const shutdown = async () => {
  logger.info('Shutting down...');
  serial.close();
  await server.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
