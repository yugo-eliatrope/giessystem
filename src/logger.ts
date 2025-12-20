export class Logger {
  public static onLog: null | ((message: string) => void) = null;

  constructor(private readonly serviceName: string) {}

  public info(...args: unknown[]) {
    this.logWithTimestamp('[INFO] ', this.serviceName, ...args);
  }

  public error(...args: unknown[]) {
    this.logWithTimestamp('[ERROR]', this.serviceName, ...args);
  }

  private logWithTimestamp(prefix: string, ...args: unknown[]) {
    const timestamp = new Date().toISOString();
    const text = [`[${timestamp}]`, `[${this.serviceName}]`, args.join(' ')].join(' ');
    Logger.onLog?.(text);
    console.log(text);
  }
}
