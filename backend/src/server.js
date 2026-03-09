import dotenv from 'dotenv';
dotenv.config();   // MUST be first

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcrypt';

import { supabase } from './config/supabase.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import screenshotRoutes from './routes/screenshots.js';
import activityRoutes from './routes/activity.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startSchedulers } from './tasks/scheduler.js';

console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Loaded" : "Missing");

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/screenshots', screenshotRoutes);
app.use('/api/activity', activityRoutes);

// Start scheduled tasks
startSchedulers();

app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('Team Logger Backend Running');
});

/*
  TEMPORARY ADMIN SEED ROUTE
  Remove after first successful admin creation
*/
app.get('/api/create-admin', async (req, res) => {
  try {
    console.log("Create admin route hit");

    // Check if admin already exists
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@teamlogger.com')
      .single();

    if (existing) {
      return res.json({ message: 'Admin already exists' });
    }

    // Hash password properly
    const hashedPassword = await bcrypt.hash('123456', 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name: 'Admin',
          email: 'admin@teamlogger.com',
          password_hash: hashedPassword
        }
      ])
      .select();

    if (error) {
      console.error(error);
      return res.status(500).json(error);
    }

    res.json({ message: 'Admin created successfully', data });

  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/create-user', async (req, res) => {
  try {
    const bcrypt = (await import('bcrypt')).default;

    const hashed = await bcrypt.hash('user123', 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name: 'Demo User',
          email: 'user@teamlogger.com',
          password_hash: hashed,
          role: 'user'
        }
      ])
      .select();

    if (error) return res.json(error);

    res.json({ message: 'User created', data });
  } catch (err) {
    res.json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

