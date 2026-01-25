import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { JobPayload } from '@runright/common';

// In a real scenario, configuration would come from env vars
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class QueueService {
  private redis: Redis;
  private readonly QUEUE_KEY = 'submission_queue';

  constructor() {
    this.redis = new Redis(REDIS_URL, {
        lazyConnect: true,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    });
    
    this.redis.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
    });
    
    this.redis.on('connect', () => {
        logger.info('Connected to Redis queue');
    });

    // Attempt to connect but don't crash if it fails immediately (lazy)
    this.redis.connect().catch(err => {
         logger.warn('Failed to connect to Redis initially', { error: err.message });
    });
  }

  async addJob(job: JobPayload): Promise<void> {
    try {
      await this.redis.rpush(this.QUEUE_KEY, JSON.stringify(job));
      logger.info('Job added to queue', { submissionId: job.submissionId });
    } catch (error: any) {
      logger.error('Failed to add job to queue', { error: error.message, submissionId: job.submissionId });
      throw error;
    }
  }

  async getQueueDepth(): Promise<number> {
    try {
      return await this.redis.llen(this.QUEUE_KEY);
    } catch (error) {
      return 0;
    }
  }
}

export const queueService = new QueueService();
