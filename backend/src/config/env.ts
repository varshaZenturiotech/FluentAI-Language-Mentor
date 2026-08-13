import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface IEnvConfig {
  NODE_ENV: string;
  PORT: number;
  API_PREFIX: string;
  CLIENT_URL: string;
  VERSION: string;
  AI_SERVICE_URL: string;
  AI_REQUEST_TIMEOUT: number;
  INTERNAL_API_KEY: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required but missing.`);
  }
  return value;
};

export const env: IEnvConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: parseInt(getEnvVar('PORT', '5000'), 10),
  API_PREFIX: getEnvVar('API_PREFIX', '/api/v1'),
  CLIENT_URL: getEnvVar('CLIENT_URL', 'http://localhost:5173'),
  VERSION: '1.0.0',
  AI_SERVICE_URL: getEnvVar('AI_SERVICE_URL', 'http://localhost:5001'),
  AI_REQUEST_TIMEOUT: parseInt(getEnvVar('AI_REQUEST_TIMEOUT', '120000'), 10),
  INTERNAL_API_KEY: getEnvVar('INTERNAL_API_KEY'),
};

/**
 * Validates that all required environment variables are set correctly before startup.
 */
export const validateEnv = (): void => {
  if (isNaN(env.PORT) || env.PORT <= 0) {
    throw new Error('Invalid PORT configuration. PORT must be a positive integer.');
  }
  if (isNaN(env.AI_REQUEST_TIMEOUT) || env.AI_REQUEST_TIMEOUT <= 0) {
    throw new Error('Invalid AI_REQUEST_TIMEOUT configuration. Must be a positive integer.');
  }
  if (!env.AI_SERVICE_URL.startsWith('http://') && !env.AI_SERVICE_URL.startsWith('https://')) {
    throw new Error('Invalid AI_SERVICE_URL configuration. Must start with http:// or https://');
  }
  if (!env.INTERNAL_API_KEY || env.INTERNAL_API_KEY.trim() === '') {
    throw new Error('INTERNAL_API_KEY must be provided for secure AI Gateway calls.');
  }
};
