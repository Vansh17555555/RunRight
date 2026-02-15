import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { JobPayload } from '@runright/common';

// In a real scenario, configuration would come from env vars
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class QueueService {
  private redis: Redis;
  private readonly QUEUE_FAST = 'submission_queue:fast';
  private readonly QUEUE_HEAVY = 'submission_queue:heavy';

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

  async addJob(job: JobPayload, type: 'fast' | 'heavy' = 'fast'): Promise<void> {
    const queue = type === 'heavy' ? this.QUEUE_HEAVY : this.QUEUE_FAST;
    try {
      await this.redis.rpush(queue, JSON.stringify(job));
      logger.info('Job added to queue', { submissionId: job.submissionId, queue });
    } catch (error: any) {
      logger.error('Failed to add job to queue', { error: error.message, submissionId: job.submissionId });
      throw error;
    }
  }

  async getQueueDepth(): Promise<number> {
    try {
      const fast = await this.redis.llen(this.QUEUE_FAST);
      const heavy = await this.redis.llen(this.QUEUE_HEAVY);
      return fast + heavy;
    } catch (error) {
      return 0;
    }
  }
}

export const queueService = new QueueService();
