import process from 'process';

import { Logger } from './logger';
import { SerialManager } from './serial-manager';
import { HttpServer } from './http-server';
import { DatabaseManager } from './database-manager';
import { InfoWebSocketServer } from './websocket-server';
import { EventBus } from './event-bus';

export class Orchestrator {
  constructor(
    private readonly logger: Logger,
    private readonly eventBus: EventBus,
    private readonly database: DatabaseManager,
    private readonly serial: SerialManager,
    private readonly httpServer: HttpServer,
    private readonly wsServer: InfoWebSocketServer,
  ) {
    this.setupEventFlows();
  }

  private setupEventFlows(): void {
    /**
     * FLOW 1: Sensor data → Database
     * When sensor data arrives, save it to the database
     */
    this.eventBus.on('sensor:data', (data) => {
      this.database.saveSensorReading(data);
    });

    /**
     * FLOW 2: Pump command → Serial port
     * When pump activation is requested, write to Arduino
     */
    this.eventBus.on('pump:activate', ({ time }) => {
      this.serial.write(time.toString());
    });

    /**
     * FLOW 3: Log entries → Database
     * Add log messages to the database
     */
    this.eventBus.on('log:entry', ({ message }) => {
      this.database.saveLogEntry({ message });
    });

    this.logger.info('Event flows configured');
  }

  public async start(): Promise<void> {
    this.logger.info('Starting up...');
    await this.database.connect();
    this.httpServer.server.on('upgrade', (request, socket, head) => {
      this.wsServer.handleUpgrade(request, socket, head);
    });
    this.httpServer.start();
    this.wsServer.startBroadcasting(5000);
    this.setupShutdownHandlers();
    this.logger.info('Startup complete');
  }

  private setupShutdownHandlers(): void {
    const shutdown = async () => {
      this.logger.info('Shutting down...');
      this.serial.close();
      this.wsServer.close();
      await this.httpServer.stop();
      await this.database.disconnect();
      this.logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

