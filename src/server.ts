import fs from 'fs';
import http from 'http';
import path from 'path';

import { Logger } from './logger';
import { Store } from './store';

export class Server {
  private server: http.Server;
  private logger = new Logger('Server');

  constructor(
    private readonly port: number,
    private readonly onWrite: (data: string) => void,
    private readonly getData: () => Store
  ) {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });
  }

  public start() {
    this.server.listen(this.port, () => {
      this.logger.info(`Listening on port ${this.port}`);
    });
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const url = new URL(`http://localhost${req.url}`);
    switch (url.pathname) {
      case '/info': {
        this.handleInfoRequest(res);
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
  }

  private handleIndexRequest(res: http.ServerResponse) {
    const filePath = path.join(__dirname, '..', 'public', 'index.html');
    try {
      const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = 200;
      res.write(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to read index.html: ${message}`);
      res.statusCode = 500;
    }
  }

  private handleInfoRequest(res: http.ServerResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(this.getData()));
    res.statusCode = 200;
  }

  private handlePumpRequest(res: http.ServerResponse, params: URLSearchParams) {
    const time = Number.parseInt(params.get('time') || '', 10);
    if (Number.isNaN(time) || time < 2 || time > 32) {
      res.statusCode = 400;
      res.write(JSON.stringify({ error: 'Invalid time parameter' }));
      return;
    }
    this.onWrite(time.toString());
    res.statusCode = 200;
  }
}
