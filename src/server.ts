import http from 'http';

import { State } from './domain';
import { ILogger } from './logger';

export type ServerDeps = {
  logger: ILogger;
  indexHtml: string;
};

export type ServerConfig = {
  port: number;
};

export type ServerCallbacks = {
  onWrite: (data: string) => void;
  getState: () => Promise<State>;
};

export class Server {
  private server: http.Server;
  private logger: ILogger;
  private indexHtml: string;

  constructor(
    private readonly config: ServerConfig,
    private readonly callbacks: ServerCallbacks,
    deps: ServerDeps
  ) {
    this.logger = deps.logger;
    this.indexHtml = deps.indexHtml;
    this.server = http.createServer(async (req, res) => {
      await this.handleRequest(req, res);
    });
  }

  public start = () => {
    this.server.listen(this.config.port, () => {
      this.logger.info(`Listening on port ${this.config.port}`);
    });
  };

  public stop = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          this.logger.error(`Error closing server: ${err.message}`);
          reject(err);
        } else {
          this.logger.info('Server closed');
          resolve();
        }
      });
    });
  };

  private handleRequest = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = new URL(`http://localhost${req.url}`);
    switch (url.pathname) {
      case '/info': {
        await this.handleInfoRequest(res);
        break;
      }
      case '/pump': {
        this.handlePumpRequest(res, url.searchParams);
        break;
      }
      case '/': {
        this.handleIndexRequest(res);
        break;
      }
      default: {
        res.statusCode = 404;
      }
    }
    res.end('');
  };

  private handleIndexRequest = (res: http.ServerResponse) => {
    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 200;
    res.write(this.indexHtml);
  };

  private handleInfoRequest = async (res: http.ServerResponse) => {
    const state = await this.callbacks.getState();
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(state));
    res.statusCode = 200;
  };

  private handlePumpRequest = (res: http.ServerResponse, params: URLSearchParams) => {
    const time = Number.parseInt(params.get('time') || '', 10);
    if (Number.isNaN(time) || time < 2 || time > 32) {
      res.statusCode = 400;
      res.write(JSON.stringify({ error: 'Invalid time parameter' }));
      return;
    }
    this.callbacks.onWrite(time.toString());
    res.statusCode = 200;
  };
}
