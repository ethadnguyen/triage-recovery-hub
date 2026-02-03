import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { getRedisClient } from '../config/redis.js';

export class HealthController {
  checkHealth = async (_req: Request, res: Response): Promise<void> => {
    let databaseStatus = 'healthy';
    let redisStatus = 'healthy';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = 'unhealthy';
    }

    try {
      const redis = getRedisClient();
      await redis.ping();
    } catch {
      redisStatus = 'unhealthy';
    }

    const overallStatus =
      databaseStatus === 'healthy' && redisStatus === 'healthy'
        ? 'healthy'
        : 'unhealthy';

    res.json({
      status: overallStatus,
      database: databaseStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    });
  };

  getRoot = (_req: Request, res: Response): void => {
    res.json({
      message: 'AI Support Triage & Recovery Hub API',
      version: '1.0.0',
      docs: '/api-docs',
    });
  };
}
