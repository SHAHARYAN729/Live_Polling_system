import { Router } from 'express';
import { getHistory, healthCheck } from '../controllers/PollController';

const router = Router();

router.get('/api/history', getHistory);
router.get('/api/health', healthCheck);

export default router;
