export interface ILogger {
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  child: (scope: string) => ILogger;
}

export class Logger implements ILogger {
  constructor(private readonly scope?: string) {}

  public info = (...args: unknown[]) => {
    this.log('INFO ', ...args);
  };

  public error = (...args: unknown[]) => {
    this.log('ERROR', ...args);
  };

  public child = (scope: string): ILogger => new Logger(this.scope ? `${this.scope}:${scope}` : scope);

  private log = (level: string, ...args: unknown[]) => {
    const timestamp = new Date().toISOString();
    const scopePrefix = this.scope ? `[${this.scope}] ` : '';
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
    console.log(`[${timestamp}] [${level}] ${scopePrefix}${message}`);
  };
}
