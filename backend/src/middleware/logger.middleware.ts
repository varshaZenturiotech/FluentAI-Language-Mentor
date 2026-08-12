import morgan, { StreamOptions } from 'morgan';
import { logger } from '../utils/logger';

// Morgan stream options connecting HTTP request logging to our central logger
const stream: StreamOptions = {
  write: (message: string) => logger.info(message.trim()),
};

// Custom format including request ID
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';

export const loggerMiddleware = morgan(morganFormat, { stream });
