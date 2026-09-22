import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { listMessages, sendMessage } from '../controllers/messageController.js';
const router = Router();
router.use(protect);
router.route('/:exchangeId').get(listMessages).post(sendMessage);
export default router;
