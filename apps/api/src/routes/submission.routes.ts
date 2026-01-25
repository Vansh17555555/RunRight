import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/', authMiddleware, rateLimitMiddleware, SubmissionController.createSubmission);
router.get('/:id', authMiddleware, SubmissionController.getSubmission);

export default router;
