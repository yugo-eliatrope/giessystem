import http from 'http';
import { Duplex } from 'stream';

import { WebSocketServer, WebSocket } from 'ws';

import { State } from './domain';
import { ILogger } from './logger';

export type WebSocketServerDeps = {
  logger: ILogger;
};

export type WebSocketServerCallbacks = {
  getState: () => Promise<State>;
};

export class InfoWebSocketServer {
  private wss: WebSocketServer;
  private logger: ILogger;
  private clients: Set<WebSocket> = new Set();
  private broadcastInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly callbacks: WebSocketServerCallbacks,
    deps: WebSocketServerDeps
  ) {
    this.logger = deps.logger;
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      this.logger.info(`Client connected. Total clients: ${this.clients.size}`);

      this.sendState(ws);

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

  public startBroadcasting = (intervalMs: number = 5000) => {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }
    this.broadcastInterval = setInterval(() => this.broadcast(), intervalMs);
    this.logger.info(`Broadcasting started with ${intervalMs} ms interval`);
  };

  public stopBroadcasting = () => {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
      this.logger.info('Broadcasting stopped');
    }
  };

  public broadcast = async () => {
    if (this.clients.size === 0) return;

    try {
      const state = await this.callbacks.getState();
      const message = JSON.stringify(state);

      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    } catch (error) {
      this.logger.error(`Broadcast error: ${(error as Error).message}`);
    }
  };

  private sendState = async (ws: WebSocket) => {
    try {
      const state = await this.callbacks.getState();
      ws.send(JSON.stringify(state));
    } catch (error) {
      this.logger.error(`Send state error: ${(error as Error).message}`);
    }
  };

  public close = () => {
    this.stopBroadcasting();
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
    this.wss.close();
    this.logger.info('WebSocket server closed');
  };
}
