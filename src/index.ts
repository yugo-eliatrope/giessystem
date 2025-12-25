import { config } from './config';
import { EventBus } from './event-bus';
import { Logger } from './logger';
import { DatabaseManager } from './database-manager';
import { SerialManager } from './serial-manager';
import { HttpServer } from './http-server';
import { WebSocketServer } from './websocket-server';
import { readAllFilesInDir } from './fs';
import { Orchestrator } from './orchestrator';

const main = async () => {
  const eventBus = new EventBus();
  const logger = new Logger(eventBus);

  const database = new DatabaseManager(logger.child('Database'));

  const httpServer = new HttpServer(
    config.httpServer,
    logger.child('HTTP'),
    eventBus,
    await readAllFilesInDir('public'),
  );

  const wsServer = new WebSocketServer(
    logger.child('WebSocket'),
    database,
  );
  
  const serial = new SerialManager(
    config.serial,
    logger.child('Serial'),
    eventBus,
  );

  const orchestrator = new Orchestrator(
    logger,
    eventBus,
    database,
    serial,
    httpServer,
    wsServer,
  );
  await orchestrator.start();
  logger.info('Startup complete');
};

main();
