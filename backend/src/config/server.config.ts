import { CorsOptions } from 'cors';
import { env } from './env';

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    const allowedOrigins = [env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173'];
    if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error('CORS policy validation failed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
};

export const serverConfig = {
  port: env.PORT,
  env: env.NODE_ENV,
  apiPrefix: env.API_PREFIX,
  clientUrl: env.CLIENT_URL,
  version: env.VERSION,
  cors: corsConfig,
};
