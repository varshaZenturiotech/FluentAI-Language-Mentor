import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { serverConfig } from './config/server.config';
import {
  requestIdMiddleware,
  loggerMiddleware,
  notFoundMiddleware,
  errorMiddleware,
} from './middleware';
import apiRoutes from './routes';

/**
 * Express Application Configuration
 * Assembles security headers, body parsers, logging, routes, and error handling.
 */
class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Unique request ID generator
    this.app.use(requestIdMiddleware);

    // Security HTTP headers
    this.app.use(helmet());

    // Enable CORS with configured options
    this.app.use(cors(serverConfig.cors));

    // HTTP Request Logger
    this.app.use(loggerMiddleware);

    // Response compression
    this.app.use(compression());

    // Cookie parser
    this.app.use(cookieParser());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private configureRoutes(): void {
    // Mount API v1 router
    this.app.use(env.API_PREFIX, apiRoutes);
  }

  private configureErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use(notFoundMiddleware);

    // Global centralized error handler
    this.app.use(errorMiddleware);
  }
}

export default new App().app;
