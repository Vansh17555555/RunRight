import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { AuthRequest } from './auth.middleware';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const SUBMISSION_LIMIT = 10; // 10 requests
const WINDOW_SIZE_IN_SECONDS = 60; // per 1 minute

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId || req.ip;
    if (!userId) {
       return next();
    }
    
    // Key: rate_limit:submission:<userId>
    const key = `rate_limit:submission:${userId}`;

    const currentRequests = await redis.incr(key);

    if (currentRequests === 1) {
      await redis.expire(key, WINDOW_SIZE_IN_SECONDS);
    }

    if (currentRequests > SUBMISSION_LIMIT) {
      const ttl = await redis.ttl(key);
      logger.warn(`Rate limit exceeded for user ${userId}`);
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: ttl
      });
    }

    next();
  } catch (error) {
    logger.error('Rate limit error', { error });
    // Fail safe: Allow request if Redis is down
    next(); 
  }
};
