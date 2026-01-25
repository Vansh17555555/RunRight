import { Submission, SubmissionStatus, prisma } from '@runright/common';
import { logger } from '../utils/logger';

export interface ISubmissionRepository {
  create(submission: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Submission>;
  findById(id: string): Promise<Submission | null>;
  updateStatus(id: string, status: SubmissionStatus): Promise<void>;
}

export class PrismaSubmissionRepository implements ISubmissionRepository {
  async create(data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Submission> {
    try {
      return await prisma.submission.create({
        data: {
          sourceCode: data.sourceCode,
          language: data.language,
          status: data.status,
          userId: data.userId,
          problemId: data.problemId
        }
      });
    } catch (error: any) {
      logger.error('Failed to create submission in DB', { error: error.message });
      throw error;
    }
  }

  async findById(id: string): Promise<Submission | null> {
    try {
      return await prisma.submission.findUnique({
        where: { id },
        include: { result: true }
      });
    } catch (error: any) {
      logger.error('Failed to fetch submission', { error: error.message, id });
      return null;
    }
  }

  async updateStatus(id: string, status: SubmissionStatus): Promise<void> {
    try {
      await prisma.submission.update({
        where: { id },
        data: { status }
      });
    } catch (error: any) {
      logger.error('Failed to update submission status', { error: error.message, id });
    }
  }
}

export const submissionRepository = new PrismaSubmissionRepository();
