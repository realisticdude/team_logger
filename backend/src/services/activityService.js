import { supabase } from '../config/supabase.js';

const MINUTES_PER_SCREENSHOT = 10;
const IDLE_THRESHOLD_MINUTES = 15;

// Helper to format minutes into hours and minutes
const formatTime = (minutes) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
};

export const recordHeartbeat = async (userId) => {
  const { error } = await supabase
    .from('users')
    .update({ last_seen: new Date().toISOString(), status: 'online' })
    .eq('id', userId);
  if (error) throw error;
};

export const updateUserStatus = async (userId, status) => {
  const { error } = await supabase.from('users').update({ status }).eq('id', userId);
  if (error) throw error;
};

export const getActivityToday = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: screenshots, error } = await supabase
    .from('screenshots')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // 1. Calculate Time Tracked Today
  const activeMinutes = screenshots.length * MINUTES_PER_SCREENSHOT;

  // 2. Calculate Productivity (simple version)
  const totalPossibleMinutes = (new Date().getHours() - 9) * 60; // Assuming a 9am start
  const productivity = totalPossibleMinutes > 0 ? Math.min(100, Math.round((activeMinutes / totalPossibleMinutes) * 100)) : 0;

  // 3. Build Activity Timeline
  const timeline = [];
  if (screenshots.length > 0) {
    // Add the first screenshot as an active event
    timeline.push({
      time: new Date(screenshots[0].created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: 'active',
      duration: MINUTES_PER_SCREENSHOT
    });

    for (let i = 1; i < screenshots.length; i++) {
      const prevTimestamp = new Date(screenshots[i - 1].created_at);
      const currentTimestamp = new Date(screenshots[i].created_at);
      const gapMinutes = (currentTimestamp - prevTimestamp) / (1000 * 60);

      if (gapMinutes > IDLE_THRESHOLD_MINUTES) {
        timeline.push({
          time: prevTimestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          status: 'idle',
          duration: Math.round(gapMinutes)
        });
      }

      timeline.push({
        time: currentTimestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        status: 'active',
        duration: MINUTES_PER_SCREENSHOT
      });
    }
  }

  return {
    timeTracked: activeMinutes,
    productivity,
    timeline,
  };
};