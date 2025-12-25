import { EventBus } from './event-bus';

export interface ILogger {
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  child: (scope: string) => ILogger;
}

export class Logger implements ILogger {
  constructor(
    private readonly eventBus: EventBus,
    private readonly scope?: string
  ) {}

  public info = (...args: unknown[]) => {
    this.log('INFO ', '', ...args);
  };

  public error = (...args: unknown[]) => {
    this.log('ERROR', '\x1b[31m', ...args);
  };

  public child = (scope: string): ILogger => {
    const newScope = this.scope ? `${this.scope}:${scope}` : scope;
    return new Logger(this.eventBus, newScope);
  };

  private log = (level: string, color: string, ...args: unknown[]) => {
    const timestamp = new Date().toISOString();
    const scopePrefix = this.scope ? `[${this.scope}] ` : '';
    const reset = color ? '\x1b[0m' : '';
    const message = `[${level}] ${scopePrefix}${args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')}`;
    this.eventBus.emit('log:entry', { message });
    console.log(`${color}[${timestamp}] ${message}${reset}`);
  };
}
