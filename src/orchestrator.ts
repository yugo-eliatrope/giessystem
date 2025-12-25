import process from 'process';

import { DatabaseManager } from './database-manager';
import { EventBus } from './event-bus';
import { HttpServer } from './http-server';
import { Logger } from './logger';
import { SerialManager } from './serial-manager';
import { WebSocketServer } from './websocket-server';

export class Orchestrator {
  constructor(
    private readonly logger: Logger,
    private readonly eventBus: EventBus,
    private readonly database: DatabaseManager,
    private readonly serial: SerialManager,
    private readonly httpServer: HttpServer,
    private readonly wsServer: WebSocketServer
  ) {
    this.setupEventFlows();
  }

  private setupEventFlows(): void {
    /**
     * FLOW 1: Sensor data -> Database -> WebSocket
     */
    this.eventBus.on('sensor:data', async (data) => {
      const sensorReading = await this.database.saveSensorReading(data);
      this.wsServer.broadcastMessage({ type: 'reading', data: sensorReading });
    });

    /**
     * FLOW 2: Pump command -> Serial port
     */
    this.eventBus.on('pump:activate', ({ time }) => {
      this.serial.write(time.toString());
    });

    /**
     * FLOW 3: Log entries -> Database -> WebSocket
     */
    this.eventBus.on('log:entry', async ({ message }) => {
      const logEntry = await this.database.saveLogEntry({ message });
      this.wsServer.broadcastMessage({ type: 'log', data: logEntry });
    });

    this.logger.info('Event flows configured');
  }

  public async start(): Promise<void> {
    await this.database.connect();
    this.httpServer.server.on('upgrade', (request, socket, head) => {
      this.wsServer.handleUpgrade(request, socket, head);
    });
    this.httpServer.start();
    this.setupShutdownHandlers();
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
