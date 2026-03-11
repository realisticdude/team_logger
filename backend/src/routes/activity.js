import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getActivityToday, recordHeartbeat } from '../services/activityService.js';

const router = Router();

router.post('/heartbeat', authenticate, async (req, res, next) => {
  try {
    const { status = 'active' } = req.body;
    await recordHeartbeat(req.user.sub, status);
    res.status(200).json({ message: 'Heartbeat recorded' });
  } catch (err) {
    next(err);
  }
});

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