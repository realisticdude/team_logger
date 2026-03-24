import { Router } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';
import { signToken } from '../utils/jwt.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
    const { data, error } = await supabase.from('users').select('id,email,name,role,password_hash').eq('email', email).limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, data.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ sub: data.id, role: data.role, email: data.email });
    res.json({ token, user: { id: data.id, email: data.email, name: data.name, role: data.role } });
  } catch (err) {
    next(err);
  }
});

export default router;
