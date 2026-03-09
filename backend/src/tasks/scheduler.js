import cron from 'node-cron';
import { cleanupOldScreenshots } from '../services/cleanupService.js';

export const startSchedulers = () => {
  // Schedule to run every day at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    await cleanupOldScreenshots();
  });

  console.log('Cleanup scheduler started. Will run every day at 3:00 AM.');
};