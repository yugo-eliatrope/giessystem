import http from 'http';
import path from 'path';

import { EventBus } from './event-bus';
import { ILogger } from './logger';

type Config = {
  port: number;
};

export class HttpServer {
  public readonly server: http.Server;

  constructor(
    private readonly config: Config,
    private readonly logger: ILogger,
    private readonly eventBus: EventBus,
    private readonly staticFiles: Record<string, Buffer>
  ) {
    this.server = http.createServer(async (req, res) => {
      await this.handleRequest(req, res);
    });
  }

  public start = () => {
    this.server.listen(this.config.port, () => {
      this.logger.info(`Listening on port ${this.config.port}`);
    });
  };

  public stop = (): Promise<void> =>
    new Promise((resolve, reject) => {
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

  private handleRequest = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = new URL(`http://localhost${req.url}`);
    switch (url.pathname) {
      case '/pump': {
        this.handlePumpRequest(res, url.searchParams);
        break;
      }
      case '/': {
        this.handleIndexRequest(res);
        break;
      }
      default: {
        this.handleStaticFileRequest(res, url.pathname);
        break;
      }
    }
    res.end('');
  };

  private handleIndexRequest = (res: http.ServerResponse) => {
    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 200;
    res.write(this.staticFiles['public/index.html']);
  };

  private handlePumpRequest = (res: http.ServerResponse, params: URLSearchParams) => {
    const time = Number.parseInt(params.get('time') || '', 10);
    if (Number.isNaN(time) || time < 2 || time > 32) {
      res.statusCode = 400;
      res.write(JSON.stringify({ error: 'Invalid time parameter' }));
      return;
    }
    this.eventBus.emit('pump:activate', { time });
    res.statusCode = 200;
  };

  private handleStaticFileRequest = (res: http.ServerResponse, urlPathname: string) => {
    const filePath = urlPathname.replace(/^\//, '');
    const file = this.staticFiles[filePath];
    if (file) {
      res.setHeader('Content-Type', this.getMimeType(filePath));
      res.statusCode = 200;
      res.write(file);
    } else {
      res.statusCode = 404;
    }
  };

  private getMimeType = (filePath: string) => {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
      case '.html':
        return 'text/html';
      case '.css':
        return 'text/css';
      case '.js':
        return 'application/javascript';
      default:
        return 'application/octet-stream';
    }
  };
}
