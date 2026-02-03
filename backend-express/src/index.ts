import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { closeRedisConnection } from './config/redis.js';
import { container } from './container.js';
import { logger } from './config/logger.js';

async function bootstrap(): Promise<void> {
  logger.info('Starting AI Support Triage & Recovery Hub API...');

  await connectDatabase();

  const app = createApp();

  const server = app.listen(config.server.port, () => {
    logger.info(`Server running on http://localhost:${config.server.port}`);
    logger.info(`API Docs: http://localhost:${config.server.port}/health`);
    logger.info(`Environment: ${config.server.nodeEnv}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');

      await container.cleanup();
      await closeRedisConnection();
      await disconnectDatabase();

      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
