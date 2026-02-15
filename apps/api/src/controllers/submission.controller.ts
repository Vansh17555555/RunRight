import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { submissionRepository } from '../repositories/submission.repository';
import { queueService } from '../services/queue.service';
import { Submission, SubmissionStatus } from '@runright/common';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

export class SubmissionController {
  
  static async createSubmission(req: Request, res: Response) {
    const { sourceCode, language, problemId } = req.body;
    const userId = (req as AuthRequest).user?.userId;

    // Basic Validation
    if (!sourceCode || !language) {
      logger.warn('Submission failed validation', { body: req.body });
      return res.status(400).json({ error: 'sourceCode and language are required' });
    }

    try {
      // 1. Persist to DB (Generates ID)
      const submission = await submissionRepository.create({
        sourceCode,
        language,
        status: SubmissionStatus.PENDING,
        userId: userId || null,
        problemId: problemId || null
      });
      
      const { id } = submission;

      // 2. Determine Queue Type
      let queueType: 'fast' | 'heavy' = 'fast';
      
      if (problemId) {
        // We need to import prisma to query test cases
        const { prisma } = require('@runright/common');
        const testCaseCount = await prisma.testCase.count({
           where: { problemId }
        });
        
        if (testCaseCount > 500) {
            queueType = 'heavy';
        }
      }

      // 3. Push to Queue
      await queueService.addJob({
        submissionId: id,
        language,
        code: sourceCode,
        problemId: problemId || null
      }, queueType);

      logger.info('Submission created and queued', { submissionId: id, queueType });
      return res.status(202).json({ 
        message: 'Submission accepted',
        submissionId: id
      });

    } catch (error: any) {
      logger.error('Error handling submission', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getSubmission(req: Request, res: Response) {
    const { id } = req.params;
    const submission = await submissionRepository.findById(id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    return res.json(submission);
  }
}
