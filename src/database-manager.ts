import { PrismaClient } from '@prisma/client';

import { LogEntry, SensorReading, UnsavedSensorReading, UnsavedLogEntry, State } from './domain';
import { ILogger } from './logger';

export class DatabaseManager {
  private prisma: PrismaClient;

  constructor(private readonly logger: ILogger) {
    this.prisma = new PrismaClient();
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
    this.logger.info('Connected to database');
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    this.logger.info('Disconnected from database');
  }

  public async saveSensorReading(data: UnsavedSensorReading): Promise<SensorReading> {
    return this.prisma.sensorReading.create({
      data,
    });
  }

  private async getSensorReadings(limit = 100): Promise<SensorReading[]> {
    return this.prisma.sensorReading.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  public async saveLogEntry(data: UnsavedLogEntry): Promise<LogEntry> {
    return this.prisma.logEntry.create({
      data,
    });
  }

  private async getLogEntries(limit = 100): Promise<LogEntry[]> {
    return this.prisma.logEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getState(): Promise<State> {
    const [sensorReading, logEntries] = await Promise.all([this.getSensorReadings(1), this.getLogEntries(100)]);
    return {
      temperature: sensorReading[0]?.temperature,
      humidity: sensorReading[0]?.humidity,
      updated: sensorReading[0]?.createdAt,
      logMsgs: logEntries,
    };
  }
}
