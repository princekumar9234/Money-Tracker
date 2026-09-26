import { Router } from 'express';
import {
  analyzeTransaction,
  getAnalysis,
  getRiskyTransactions,
} from '../controllers/analysis.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/risky', getRiskyTransactions);
router.post('/:transactionId', analyzeTransaction);
router.get('/:transactionId', getAnalysis);

export default router;
