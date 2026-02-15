import Redis from 'ioredis';
import { logger } from './utils/logger';
import { ExecutorService } from './services/executor.service';
import { verdictService } from './services/verdict.service';
import { JobPayload, SubmissionStatus, prisma, RedisEvents } from '@runright/common';
import { JudgingService, EvaluationResult } from './services/judging.service';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_FAST = 'submission_queue:fast';
const QUEUE_HEAVY = 'submission_queue:heavy';

class Worker {
  private redis: Redis;
  private executor: ExecutorService;
  private judgingService: JudgingService;
  private isRunning: boolean = false;

  constructor() {
    this.redis = new Redis(REDIS_URL, {
        lazyConnect: true,
        retryStrategy: (times: number) => Math.min(times * 100, 3000)
    });
    this.executor = new ExecutorService();
    this.judgingService = new JudgingService();

    this.redis.on('error', (err: any) => {
      logger.error('Redis connection error', { error: err.message });
    });
  }

  async start() {
    this.isRunning = true;
    logger.info('Worker Service Started');
    
    await this.redis.connect().catch(err => {
        logger.warn('Initial Redis connect failed', { error: err.message });
    });

    this.processLoop();
  }

  private async processLoop() {
    while (this.isRunning) {
      try {
        // Priority: FAST first, then HEAVY
        // blpop(key1, key2, ..., timeout)
        const result = await this.redis.blpop(QUEUE_FAST, QUEUE_HEAVY, 2);
        if (!result) continue;

        const [_, jobData] = result;
        await this.processJob(JSON.parse(jobData));

      } catch (error: any) {
        if (error.message !== 'Connection is closed.') {
             logger.error('Error in process loop', { error: error.message });
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async processJob(job: JobPayload) {
    logger.info('Processing job', { submissionId: job.submissionId, language: job.language, isProblem: !!job.problemId });

    try {
      let result: EvaluationResult;

      if (job.problemId) {
        result = await this.judgingService.judge(job.submissionId, job.problemId, job.language, job.code);
      } else {
        const output = await this.executor.execute(job.language, job.code);
        result = {
          verdict: verdictService.determineVerdict(output),
          stdout: output.stdout,
          stderr: output.stderr,
          passedTests: 0,
          totalTests: 0,
          cpuTime: output.duration
        };
      }

      logger.info('Job Completed', { submissionId: job.submissionId, verdict: result.verdict });
      
      try {
        await prisma.$transaction([
          prisma.executionResult.create({
            data: {
              submissionId: job.submissionId,
              verdict: result.verdict,
              stdout: result.stdout,
              stderr: result.stderr,
              cpuTime: result.cpuTime,
              passedTests: result.passedTests,
              totalTests: result.totalTests,
            }
          }),
          prisma.submission.update({
            where: { id: job.submissionId },
            data: { status: SubmissionStatus.COMPLETED }
          })
        ]);

        await this.redis.publish(
            RedisEvents.SUBMISSION_COMPLETED, 
            JSON.stringify({ 
                submissionId: job.submissionId,
                result: {
                    verdict: result.verdict,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    passedTests: result.passedTests,
                    totalTests: result.totalTests,
                    cpuTime: result.cpuTime
                }
            })
        );
      } catch (dbError: any) {
        logger.error('Failed to persist result to DB', { error: dbError.message, submissionId: job.submissionId });
      }

    } catch (error: any) {
      logger.error('Job processing failed', { submissionId: job.submissionId, error: error.message });
    }
  }

  stop() {
    this.isRunning = false;
    this.redis.disconnect();
  }
}

const worker = new Worker();
worker.start();

process.on('SIGINT', () => {
    logger.info('Shutting down worker...');
    worker.stop();
    process.exit(0);
});
