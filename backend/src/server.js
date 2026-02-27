import dotenv from 'dotenv';
dotenv.config();   // MUST be first

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import screenshotRoutes from './routes/screenshots.js';
import { errorHandler } from './middleware/errorHandler.js';
import { scheduleCleanup } from './tasks/cleanup.js';

console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Loaded" : "Missing");

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/screenshots', screenshotRoutes);

app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('Team Logger Backend Running');
});

app.get('/create-admin', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name: 'Admin',
          email: 'admin@teamlogger.com',
          password_hash: '123456'
        }
      ])

    if (error) return res.json(error)

    res.json({ message: 'Admin created', data })
  } catch (err) {
    res.json({ error: err.message })
  }
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  process.stdout.write(`Server listening on port ${PORT}\n`);
});

scheduleCleanup();