import process from 'process';
import { Logger } from './logger.ts';
import { SerialManager } from './serial-manager.ts';
import { StoreManager } from './store.ts';
import { Server } from './server.ts';

const logger = new Logger('GiesSystem');

const path = process.argv[2];
const MAX_LOG_MSGS = 200;

if (!path) {
  logger.error('No path provided');
  process.exit(1);
}

const store = new StoreManager(MAX_LOG_MSGS);
const serial = new SerialManager(path, (t, h) => store.update(t, h));
const server = new Server(8080, (data: string) => serial.write(data), () => store.data);

server.start();

process.on('SIGINT', () => {
  logger.info('Shutting down...');
  serial.close();
  process.exit(0);
});
