import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  deleteAccount,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.delete('/account', deleteAccount);

export default router;
