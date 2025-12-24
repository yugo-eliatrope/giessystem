import process from 'process';

import { config } from './config';
import { Logger } from './logger';
import { SerialManager } from './serial-manager';
import { HttpServer } from './http-server';
import { DatabaseManager } from './database-manager';
import { InfoWebSocketServer } from './websocket-server';
import { readAllFilesInDir } from './fs';

const startUp = async () => {
  const logger = new Logger();
  const database = new DatabaseManager(logger.child('Database'));
  await database.connect();
  Logger.onLog = (message: string) => database.saveLogEntry({ message });
  
  const serial = new SerialManager(
    config.serial,
    { logger: logger.child('Serial') }, (t: number, h: number) => database.saveSensorReading({ temperature: t, humidity: h })
  );
  
  const httpServer = new HttpServer(
    config.server,
    await readAllFilesInDir('public'),
    { onWrite: (data: string) => serial.write(data) },
    { logger: logger.child('Server') }
  );
  
  const wsServer = new InfoWebSocketServer(
    { getState: () => database.getState() },
    { logger: logger.child('WebSocket') }
  );
  
  httpServer.server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head);
  });
  
  httpServer.start();
  wsServer.startBroadcasting(5000);
  
  const shutdown = async () => {
    logger.info('Shutting down...');
    serial.close();
    wsServer.close();
    await httpServer.stop();
    await database.disconnect();
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startUp();
