import { LogEntry, SensorReading } from '.prisma/client';

type UnsavedData<T extends { id: number; createdAt: Date }> = Omit<T, 'id' | 'createdAt'>;

export type UnsavedSensorReading = UnsavedData<SensorReading>;
export type UnsavedLogEntry = UnsavedData<LogEntry>;

export type State = {
  temperature: number;
  humidity: number;
  updated: Date;
  logMsgs: LogEntry[];
};

export type { SensorReading, LogEntry };

export const isUnsavedSensorReading = (data: UnsavedLogEntry | UnsavedSensorReading): data is UnsavedSensorReading =>
  'temperature' in data;
