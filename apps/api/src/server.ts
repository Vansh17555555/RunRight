import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import authRoutes from './routes/auth.routes';
import submissionRoutes from './routes/submission.routes';
import problemRoutes from './routes/problem.routes';
import { logger } from './utils/logger';
import { SocketService } from './services/socket.service';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket Service
new SocketService(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

import { queueService } from './services/queue.service';

// Routes
app.use('/auth', authRoutes);
app.use('/submissions', submissionRoutes);
app.use('/problems', problemRoutes);

app.get('/admin/stats', authMiddleware, async (req, res) => {
  const depth = await queueService.getQueueDepth();
  res.json({
    service: 'api',
    queueDepth: depth,
    status: 'healthy',
    timestamp: new Date()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    logger.warn('Invalid JSON payload', { error: err.message });
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(PORT, () => {
  logger.info(`API Service running on port ${PORT}`);
});

