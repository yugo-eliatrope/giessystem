// Re-export Prisma generated types
export type { SensorReading, LogEntry } from '.prisma/client';

// Application types
export type SensorData = {
  temperature: number;
  humidity: number;
};

export type ParsedData = SensorData | string;

export type Store = {
  temperature: number;
  humidity: number;
  updated: Date;
  logMsgs: string[];
};

