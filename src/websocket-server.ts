import http from 'http';
import { Duplex } from 'stream';

import { WebSocketServer as WsWebSocketServer, WebSocket } from 'ws';

import { LogEntry, SensorReading, State } from './domain';
import { ILogger } from './logger';

interface IStore {
  getState: () => Promise<State>;
};

type OutgoingMessage = {
  type: 'state';
  data: State;
} | {
  type: 'log';
  data: LogEntry;
} | {
  type: 'reading';
  data: SensorReading;
};

export class WebSocketServer {
  private wss: WsWebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(
    private readonly logger: ILogger,
    private readonly store: IStore,
  ) {
    this.wss = new WsWebSocketServer({ noServer: true });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      this.logger.info(`Client connected. Total clients: ${this.clients.size}`);

      this.sendInitialState(ws);

      ws.on('close', () => {
        this.clients.delete(ws);
        this.logger.info(`Client disconnected. Total clients: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket error: ${error.message}`);
        this.clients.delete(ws);
      });
    });
  }

  public handleUpgrade = (request: http.IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(`http://localhost${request.url}`);
    if (url.pathname === '/info') {
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  };

  private sendInitialState = async (ws: WebSocket) => {
    try {
      const state = await this.store.getState();
      ws.send(JSON.stringify({ type: 'state', data: state }));
    } catch (error) {
      this.logger.error(`Send state error: ${(error as Error).message}`);
    }
  };

  public broadcastMessage = (message: OutgoingMessage) => {
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  };

  public close = () => {
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
    this.wss.close();
    this.logger.info('WebSocket server closed');
  };
}
