import http from 'http';
import app from './app';
import { env, validateEnv } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './database/prisma';
import { hashPassword } from './utils/bcrypt';
import { generateVerificationToken } from './utils/token';

/**
 * Seed helper to set up demo account automatically on startup
 */
async function seedDemoUser(): Promise<void> {
  try {
    const email = 'rahul@fluentai.app';
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      logger.info('🌱 Seeding default demo account: rahul@fluentai.app...');
      const passwordHash = await hashPassword('password123');
      const { hashedToken } = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: 'Rahul',
            email,
            password: passwordHash,
            nativeLanguage: 'ml',
            learningLanguage: 'en',
            level: 'BEGINNER',
            isEmailVerified: true,
          },
        });

        await tx.profile.create({
          data: {
            userId: user.id,
            dailyGoalMinutes: 15,
            currentStreak: 0,
            totalXP: 0,
          },
        });

        await tx.emailVerificationToken.create({
          data: {
            userId: user.id,
            token: hashedToken,
            expiresAt,
          },
        });
      });
      logger.info('🌱 Demo account seeded successfully!');
    }
  } catch (error) {
    logger.error('Failed to seed demo user on startup', { error });
  }
}

/**
 * Server Startup & Lifecycle Management
 */
class Server {
  private server: http.Server | null = null;

  public async start(): Promise<void> {
    try {
      // Step 1: Validate Environment Variables
      validateEnv();

      // Step 1.5: Seed default demo user if database is empty
      await seedDemoUser();

      // Step 2: Initialize HTTP Server instance
      this.server = http.createServer(app);

      // Step 3: Start listening on port
      this.server.listen(env.PORT, () => {
        logger.info(`🚀 Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
        logger.info(
          `📡 Health Check endpoint available at http://localhost:${env.PORT}${env.API_PREFIX}/health`
        );
      });

      // Step 4: Setup process lifecycle listeners
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server during initialization', { error });
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.warn(`Received ${signal}. Initiating graceful shutdown...`);

      if (this.server) {
        this.server.close((err) => {
          if (err) {
            logger.error('Error occurred while closing HTTP server', { error: err });
            process.exit(1);
          }
          logger.info('HTTP server closed successfully. Exiting process.');
          process.exit(0);
        });

        // Force shutdown if server hasn't closed within 10 seconds
        setTimeout(() => {
          logger.error('Forced shutdown: Could not close connections in time.');
          process.exit(1);
        }, 10000);
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Rejection caught', { reason: reason.message, stack: reason.stack });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception thrown', { error: error.message, stack: error.stack });
      shutdown('uncaughtException');
    });
  }
}

const serverInstance = new Server();
serverInstance.start();

export default serverInstance;
