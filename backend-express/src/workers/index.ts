import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { closeRedisConnection } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { createTriageWorker } from './triage.worker.js';

async function startWorker(): Promise<void> {
  logger.info('Starting Triage Worker...');

  await connectDatabase();

  const worker = createTriageWorker();

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down worker...`);

    await worker.close();
    await closeRedisConnection();
    await disconnectDatabase();

    logger.info('Worker shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('Worker is ready and waiting for jobs...');
}

startWorker().catch((error) => {
  logger.error('Failed to start worker:', error);
  process.exit(1);
});
