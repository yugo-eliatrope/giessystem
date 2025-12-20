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
