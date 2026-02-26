import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadToStorage, saveMetadata, listScreenshotsByUser } from '../services/screenshotService.js';

const router = Router();

router.post('/upload', authenticate, requireRole('user'), upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const { buffer, mimetype } = req.file;
    const { path, publicUrl } = await uploadToStorage(req.user.sub, buffer, mimetype);
    const saved = await saveMetadata(req.user.sub, publicUrl, new Date().toISOString());
    await import('../config/supabase.js').then(({ supabase }) =>
      supabase.from('screenshots').update({ storage_path: path }).eq('id', saved.id)
    );
    res.status(201).json({ ...saved, image_url: publicUrl });
  } catch (err) {
    next(err);
  }
});

router.get('/user/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days || '7', 10);
    if (req.user.role !== 'admin' && req.user.sub !== userId) return res.status(403).json({ error: 'Forbidden' });
    const data = await listScreenshotsByUser(userId, days);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
