export interface ILogger {
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  child: (scope: string) => ILogger;
}

export class Logger implements ILogger {
  public onLog: null | ((message: string) => void) = null;

  constructor(
    private readonly scope?: string,
  ) {}

  public info = (...args: unknown[]) => {
    this.log('INFO ', '', ...args);
  };

  public error = (...args: unknown[]) => {
    this.log('ERROR', '\x1b[31m', ...args);
  };

  public child = (scope: string): ILogger => {
    const logger = new Logger(this.scope ? `${this.scope}:${scope}` : scope);
    logger.onLog = this.onLog;
    return logger;
  }

  private log = (level: string, color: string, ...args: unknown[]) => {
    const timestamp = new Date().toISOString();
    const scopePrefix = this.scope ? `[${this.scope}]` : '';
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
    const reset = color ? '\x1b[0m' : '';
    const text = `[${level}] ${scopePrefix} ${message}`;
    this.onLog?.(text);
    console.log(`${color}[${timestamp}] ${text}${reset}`);
  };
}
