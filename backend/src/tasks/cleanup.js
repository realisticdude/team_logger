import cron from 'node-cron';
import { deleteOldScreenshots } from '../services/screenshotService.js';

export const scheduleCleanup = () => {
  cron.schedule('0 3 * * *', async () => {
    try {
      await deleteOldScreenshots(7);
    } catch {}
  });
};
