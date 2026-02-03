import { Redis } from 'ioredis';
import { config } from './index.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  return redisClient;
}

export function getRedisConnection() {
  return {
    host: config.redis.host,
    port: config.redis.port,
  };
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
}
