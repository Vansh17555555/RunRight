import { Router } from 'express';
import { ProblemController } from '../controllers/problem.controller';

const router = Router();

router.get('/', ProblemController.getAll);
router.get('/:slug', ProblemController.getBySlug);

export default router;
