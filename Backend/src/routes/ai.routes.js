import { Router } from 'express';
import {
  handleAiChat,
  getAiChatHistory,
  clearAiChatHistory,
  getFinancialSummary,
  getKnowledgeBase,
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/chat', handleAiChat);
router.get('/chat-history', getAiChatHistory);
router.delete('/chat-history', clearAiChatHistory);
router.get('/summary', getFinancialSummary);
router.get('/knowledge-base', getKnowledgeBase);

export default router;
