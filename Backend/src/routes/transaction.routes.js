import { Router } from 'express';
import multer from 'multer';
import {
  parseUploadedFile,
  importTransactions,
  getTransactions,
  getTransactionById,
  deleteTransaction,
  seedDemoTransactions,
  clearAllTransactions,
} from '../controllers/transaction.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateTransactionImport } from '../middleware/validation.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
});

const router = Router();

// Protect all transaction routes
router.use(protect);

router.post('/upload-parse', upload.single('statement'), parseUploadedFile);
router.post('/import', validateTransactionImport, importTransactions);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.delete('/:id', deleteTransaction);
router.post('/seed-demo', seedDemoTransactions);
router.delete('/clear-all', clearAllTransactions);

export default router;
