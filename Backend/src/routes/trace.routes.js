import { Router } from 'express';
import { traceTransaction } from '../controllers/trace.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/:transactionId', traceTransaction);

export default router;
