import http from 'http';
import { Duplex } from 'stream';

import { WebSocketServer as WsWebSocketServer, WebSocket } from 'ws';

import { LogEntry, SensorReading, State } from './domain';
import { ILogger } from './logger';

interface IStore {
  getState: () => Promise<State>;
}

type OutgoingMessage =
  | {
      type: 'state';
      data: State;
    }
  | {
      type: 'log';
      data: LogEntry;
    }
  | {
      type: 'reading';
      data: SensorReading;
    };

type AuthChecker = (req: http.IncomingMessage) => boolean;

export class WebSocketServer {
  private wss: WsWebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(
    private readonly logger: ILogger,
    private readonly store: IStore,
    private readonly isAuthenticated: AuthChecker
  ) {
    this.wss = new WsWebSocketServer({ noServer: true });

    this.wss.on('connection', (ws, request) => {
      const clientIp = this.getClientIp(request);
      this.clients.add(ws);
      this.logger.info(`Client [${clientIp}] connected. Total clients: ${this.clients.size}`);

      this.sendInitialState(ws);

      ws.on('close', () => {
        this.clients.delete(ws);
        this.logger.info(`Client [${clientIp}] disconnected. Total clients: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket error fot client [${clientIp}]: ${error.message}`);
        this.clients.delete(ws);
      });
    });
  }

  public handleUpgrade = (request: http.IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(`http://localhost${request.url}`);
    if (url.pathname !== '/info') {
      socket.destroy();
      return;
    }

    if (!this.isAuthenticated(request)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request);
    });
  };

  private getClientIp = (request: http.IncomingMessage): string => {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }
    return request.socket.remoteAddress || 'unknown';
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
