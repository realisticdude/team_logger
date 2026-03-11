import { Router } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,email,name,role,status,last_seen')
      .order('name', { ascending: true });
    if (error) throw error;
    
    // For each user, we could calculate metrics, but to keep it fast, 
    // we'll return the base data and let the frontend fetch details if needed.
    // However, for the dashboard list, we can add a placeholder or simple metrics.
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('users').select('id,email,name,role').eq('id', id).limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { email, name, role = 'user', password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'Missing fields' });
    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert({ email, name, role, password_hash: hash }).select('id,email,name,role').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.get('/:id/metrics', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.sub !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { getActivityToday } = await import('../services/activityService.js');
    const { data: screenshots } = await supabase.from('screenshots').select('id').eq('user_id', id);
    const activity = await getActivityToday(id);

    const metrics = { 
      todayTime: activity.timeTracked, 
      productivity: activity.productivity, 
      screenshotsCount: screenshots?.length || 0 
    };
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/activity', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.sub !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { getActivityToday } = await import('../services/activityService.js');
    const activity = await getActivityToday(id);
    res.json(activity.timeline);
  } catch (err) {
    next(err);
  }
});

export default router;
