import { PrismaClient } from '@prisma/client';

export class Database {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // Sensor readings
  async saveSensorReading(temperature: number, humidity: number) {
    return this.prisma.sensorReading.create({
      data: { temperature, humidity },
    });
  }

  async getLatestSensorReading() {
    return this.prisma.sensorReading.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSensorReadings(limit = 100) {
    return this.prisma.sensorReading.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Log entries
  async saveLogEntry(message: string) {
    return this.prisma.logEntry.create({
      data: { message },
    });
  }

  async getLogEntries(limit = 100) {
    return this.prisma.logEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
