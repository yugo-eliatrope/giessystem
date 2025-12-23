import fs from 'fs';
import path from 'path';
import process from 'process';

import { config } from './config';
import { Logger } from './logger';
import { SerialManager } from './serial-manager';
import { Server } from './server';
import { DatabaseManager } from './database-manager';

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf-8');

const logger = new Logger();
const database = new DatabaseManager(logger.child('Database'));
database.connect();
Logger.onLog = (message: string) => database.saveLogEntry({ message });

const serial = new SerialManager(
  config.serial,
  { logger: logger.child('Serial') }, (t: number, h: number) => database.saveSensorReading({ temperature: t, humidity: h })
);

const server = new Server(
  config.server,
  { onWrite: (data: string) => serial.write(data), getState: () => database.getState() },
  { logger: logger.child('Server'), indexHtml }
);

server.start();

const shutdown = async () => {
  logger.info('Shutting down...');
  serial.close();
  await server.stop();
  await database.disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
