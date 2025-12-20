import { Store } from './types';

export class StoreManager {
  private store: Store;

  constructor(private readonly maxLogMsgs: number = 100) {
    this.store = {
      temperature: NaN,
      humidity: NaN,
      updated: new Date(),
      logMsgs: [],
    };
  }

  public update = (temperature: number, humidity: number) => {
    this.store.temperature = temperature;
    this.store.humidity = humidity;
    this.store.updated = new Date();
  };

  public pushLogMsg = (msg: string) => {
    this.store.logMsgs.push(msg);
    if (this.store.logMsgs.length > this.maxLogMsgs) {
      this.store.logMsgs.shift();
    }
  };

  public get data(): Store {
    return { ...this.store };
  }
}
