import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: Max reconnection attempts reached');
        return new Error('Redis unavailable');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  logger.warn('Redis Client Error (non-critical):', err.message);
});

redisClient.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redisClient.on('ready', () => {
  logger.info('✅ Redis ready to accept commands');
});

// Connect to Redis (non-blocking)
export const connectRedis = async (): Promise<boolean> => {
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    logger.warn('⚠️  Redis connection failed - running without cache (development mode)');
    logger.warn('   To enable Redis: docker-compose up redis OR install Redis locally');
    return false;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
});

// Helper to check if Redis is available
export const isRedisAvailable = (): boolean => {
  return redisClient.isOpen && redisClient.isReady;
};

export default redisClient;
