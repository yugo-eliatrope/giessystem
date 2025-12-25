import 'dotenv/config';

const getEnvVar = (name: string): string => {
  const value = process.env[name];
  if (typeof value === 'undefined') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getEnvVarAsNumber = (name: string): number => {
  const value = getEnvVar(name);
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
};

export const config = {
  serial: {
    path: getEnvVar('SERIAL_PORT_PATH'),
    baudRate: getEnvVarAsNumber('SERIAL_BAUD_RATE'),
  },
  httpServer: {
    port: getEnvVarAsNumber('HTTP_SERVER_PORT'),
    authPassword: process.env.AUTH_PASSWORD || null,
  },
  database: {
    url: getEnvVar('DATABASE_URL'),
  },
} as const;
