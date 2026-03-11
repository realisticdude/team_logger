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

export const recordHeartbeat = async (userId, status = 'active') => {
  // 1. Update user's last seen and current status
  await supabase
    .from('users')
    .update({ last_seen: new Date().toISOString(), status: status === 'active' ? 'online' : 'idle' })
    .eq('id', userId);

  // 2. Log activity for historical tracking
  // We assume a table 'activity_logs' exists with: id, user_id, status, timestamp
  const { error } = await supabase
    .from('activity_logs')
    .insert({ user_id: userId, status, timestamp: new Date().toISOString() });
    
  if (error) {
    // If the table doesn't exist yet, we just log the error and continue
    // This prevents the whole app from crashing if the DB hasn't been migrated
    console.error('Error logging activity heartbeat:', error.message);
  }
};

export const updateUserStatus = async (userId, status) => {
  const { error } = await supabase.from('users').update({ status }).eq('id', userId);
  if (error) throw error;
};

export const getActivityToday = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Fetch heartbeats from activity_logs
  const { data: heartbeats, error: logError } = await supabase
    .from('activity_logs')
    .select('status, timestamp')
    .eq('user_id', userId)
    .gte('timestamp', today.toISOString())
    .order('timestamp', { ascending: true });

  if (!logError && heartbeats && heartbeats.length > 0) {
    const activeHeartbeats = heartbeats.filter(h => h.status === 'active').length;
    const idleHeartbeats = heartbeats.filter(h => h.status === 'idle').length;
    
    // Each heartbeat is approximately 30 seconds
    const activeMinutes = Math.round(activeHeartbeats * 0.5);
    const idleMinutes = Math.round(idleHeartbeats * 0.5);
    
    // Productivity = Active Time / (Active Time + Idle Time) * 100
    const totalMinutes = activeMinutes + idleMinutes;
    const productivity = totalMinutes > 0 ? Math.round((activeMinutes / totalMinutes) * 100) : 0;

    // Build Activity Timeline from heartbeats
    const timeline = [];
    let currentSegment = null;

    heartbeats.forEach(hb => {
      const time = new Date(hb.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      if (!currentSegment || currentSegment.status !== hb.status) {
        if (currentSegment) {
          timeline.push(currentSegment);
        }
        currentSegment = { time, status: hb.status, duration: 0.5 };
      } else {
        currentSegment.duration += 0.5;
      }
    });
    if (currentSegment) timeline.push(currentSegment);

    return {
      timeTracked: activeMinutes,
      productivity,
      timeline,
    };
  }

  // Fallback to screenshot-based calculation if no logs exist (legacy/missing table)
  const { data: screenshots, error } = await supabase
    .from('screenshots')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // New logic: 2 screenshots per 15 minutes cycle
  // Each screenshot represents roughly 7.5 minutes of activity in its cycle
  const MINUTES_PER_SCREENSHOT_RANDOM = 7.5;
  const activeMinutes = Math.round(screenshots.length * MINUTES_PER_SCREENSHOT_RANDOM);

  const totalPossibleMinutes = (new Date().getHours() - 9) * 60; // Assuming a 9am start
  const productivity = totalPossibleMinutes > 0 ? Math.min(100, Math.round((activeMinutes / totalPossibleMinutes) * 100)) : 0;

  const timeline = [];
  if (screenshots.length > 0) {
    timeline.push({
      time: new Date(screenshots[0].created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: 'active',
      duration: Math.round(MINUTES_PER_SCREENSHOT_RANDOM)
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
        duration: Math.round(MINUTES_PER_SCREENSHOT_RANDOM)
      });
    }
  }

  return {
    timeTracked: activeMinutes,
    productivity,
    timeline,
  };
};