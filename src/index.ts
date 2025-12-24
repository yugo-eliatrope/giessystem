import { config } from './config';
import { EventBus } from './event-bus';
import { Logger } from './logger';
import { DatabaseManager } from './database-manager';
import { SerialManager } from './serial-manager';
import { HttpServer } from './http-server';
import { InfoWebSocketServer } from './websocket-server';
import { readAllFilesInDir } from './fs';
import { Orchestrator } from './orchestrator';

const main = async () => {
  const eventBus = new EventBus();
  const logger = new Logger(eventBus);

  const database = new DatabaseManager(logger.child('Database'));

  const serial = new SerialManager(
    config.serial,
    logger.child('Serial'),
    eventBus,
  );

  const httpServer = new HttpServer(
    config.server,
    logger.child('HTTP'),
    eventBus,
    await readAllFilesInDir('public'),
  );

  const wsServer = new InfoWebSocketServer(
    { getState: () => database.getState() },
    logger.child('WebSocket'),
  );

  // Orchestrator sets up event flows in constructor
  const orchestrator = new Orchestrator(
    logger,
    eventBus,
    database,
    serial,
    httpServer,
    wsServer,
  );
  await orchestrator.start();
};

main();
