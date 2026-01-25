import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { RedisEvents } from '@runright/common';

export class SocketService {
  private io: Server;
  private redisSubscriber: Redis;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.redisSubscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    this.initialize();
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('subscribe', (submissionId: string) => {
        const roomName = `submission-${submissionId}`;
        socket.join(roomName);
        logger.info(`Client ${socket.id} joined ${roomName}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    // Subscribe to Redis events
    this.redisSubscriber.subscribe(RedisEvents.SUBMISSION_COMPLETED);

    this.redisSubscriber.on('message', (channel, message) => {
      if (channel === RedisEvents.SUBMISSION_COMPLETED) {
        try {
          const data = JSON.parse(message);
          const { submissionId, result } = data;
          
          if (submissionId) {
            const roomName = `submission-${submissionId}`;
            this.io.to(roomName).emit(RedisEvents.SUBMISSION_COMPLETED, result);
            logger.info(`Emitted result to ${roomName}`);
          }
        } catch (error) {
          logger.error('Error parsing Redis message', { error });
        }
      }
    });
  }
}
