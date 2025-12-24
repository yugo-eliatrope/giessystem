import process from 'process';

import { config } from './config';
import { Logger } from './logger';
import { SerialManager } from './serial-manager';
import { HttpServer } from './http-server';
import { DatabaseManager } from './database-manager';
import { InfoWebSocketServer } from './websocket-server';
import { readAllFilesInDir } from './fs';
import { UnsavedSensorReading } from './domain';

const startUp = async () => {
  const logger = new Logger();
  const database = new DatabaseManager(logger.child('Database'));
  logger.onLog = (message: string) => database.saveLogEntry({ message });
  await database.connect();

  const serial = new SerialManager(
    config.serial,
    { logger: logger.child('Serial') },
    (d: UnsavedSensorReading) => database.saveSensorReading(d),
  );
  
  const httpServer = new HttpServer(
    config.server,
    { logger: logger.child('Server') },
    { onWrite: (data: string) => serial.write(data) },
    await readAllFilesInDir('public'),
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
