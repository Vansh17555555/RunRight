import { Request, Response } from 'express';
import { prisma } from '@runright/common';
import { logger } from '../utils/logger';

export class ProblemController {
  static async getAll(req: Request, res: Response) {
    try {
      const problems = await prisma.problem.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(problems);
    } catch (error: any) {
      logger.error('Failed to fetch problems', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    try {
      const problem = await prisma.problem.findUnique({
        where: { slug },
        include: {
          testCases: {
            where: { isSample: true },
            select: { input: true, expectedOutput: true }
          }
        }
      });

      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }

      return res.json(problem);
    } catch (error: any) {
      logger.error('Failed to fetch problem detail', { error: error.message, slug });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
