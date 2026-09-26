import { Router } from 'express';
import {
  generateReport,
  getReports,
  getReportById,
  deleteReport,
} from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/', generateReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.delete('/:id', deleteReport);

export default router;
