import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getActivityToday } from '../services/activityService.js';

const router = Router();

router.get('/:userId/today', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const activityData = await getActivityToday(userId);
    res.json(activityData);
  } catch (err) {
    next(err);
  }
});

export default router;