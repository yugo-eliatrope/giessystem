import { EventEmitter } from 'events';

import { UnsavedSensorReading } from './domain';

export type AppEvents = {
  'sensor:data': UnsavedSensorReading;
  'pump:activate': { time: number };
  'log:entry': { message: string };
};

export type EventName = keyof AppEvents;

export class EventBus extends EventEmitter {
  emit<K extends EventName>(event: K, data: AppEvents[K]): boolean {
    return super.emit(event, data);
  }

  on<K extends EventName>(event: K, listener: (data: AppEvents[K]) => void): this {
    return super.on(event, listener);
  }

  once<K extends EventName>(event: K, listener: (data: AppEvents[K]) => void): this {
    return super.once(event, listener);
  }

  off<K extends EventName>(event: K, listener: (data: AppEvents[K]) => void): this {
    return super.off(event, listener);
  }
}
