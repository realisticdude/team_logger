import { supabase } from '../config/supabase.js';

const MINUTES_PER_SCREENSHOT = 10;
const IDLE_THRESHOLD_MINUTES = 15;
const toHourMinute = (date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

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

    for (let i = 0; i < heartbeats.length; i++) {
      const hb = heartbeats[i];
      const hbDate = new Date(hb.timestamp);
      const time = toHourMinute(hbDate);
      
      // Check for gap between heartbeats (each heartbeat is ~30s)
      if (i > 0) {
        const prevTimestamp = new Date(heartbeats[i - 1].timestamp);
        const currentTimestamp = new Date(hb.timestamp);
        const gapMinutes = (currentTimestamp - prevTimestamp) / (1000 * 60);
        
        // If gap is significant (> 2 minutes), insert an idle segment
        if (gapMinutes > 2) {
          if (currentSegment) {
            timeline.push(currentSegment);
          }
          const idleStartDate = new Date(prevTimestamp.getTime() + 30000);
          timeline.push({
            time: toHourMinute(idleStartDate),
            timestamp: idleStartDate.toISOString(),
            status: 'idle',
            duration: Math.round(gapMinutes - 0.5)
          });
          currentSegment = { time, timestamp: hbDate.toISOString(), status: hb.status, duration: 0.5 };
          continue;
        }
      }

      if (!currentSegment || currentSegment.status !== hb.status) {
        if (currentSegment) {
          timeline.push(currentSegment);
        }
        currentSegment = { time, timestamp: hbDate.toISOString(), status: hb.status, duration: 0.5 };
      } else {
        currentSegment.duration += 0.5;
      }
    }
    if (currentSegment) timeline.push(currentSegment);

    // Re-calculate active and idle minutes from the final timeline to ensure consistency
    const totalActiveMinutes = timeline.filter(s => s.status === 'active').reduce((sum, s) => sum + s.duration, 0);
    const totalIdleMinutes = timeline.filter(s => s.status === 'idle').reduce((sum, s) => sum + s.duration, 0);
    
    // Total tracked time is everything recorded today (active + explicit idle gaps)
    const finalTotalMinutes = totalActiveMinutes + totalIdleMinutes;
    const finalProductivity = finalTotalMinutes > 0 ? Math.round((totalActiveMinutes / finalTotalMinutes) * 100) : 0;

    return {
      timeTracked: Math.round(totalActiveMinutes),
      productivity: finalProductivity,
      timeline: timeline.map(s => ({ ...s, duration: Math.round(s.duration) })),
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
    const firstShotDate = new Date(screenshots[0].created_at);
    timeline.push({
      time: toHourMinute(firstShotDate),
      timestamp: firstShotDate.toISOString(),
      status: 'active',
      duration: Math.round(MINUTES_PER_SCREENSHOT_RANDOM)
    });

    for (let i = 1; i < screenshots.length; i++) {
      const prevTimestamp = new Date(screenshots[i - 1].created_at);
      const currentTimestamp = new Date(screenshots[i].created_at);
      const gapMinutes = (currentTimestamp - prevTimestamp) / (1000 * 60);

      if (gapMinutes > IDLE_THRESHOLD_MINUTES) {
        const idleStartDate = new Date(prevTimestamp.getTime() + 60000);
        timeline.push({
          time: toHourMinute(idleStartDate),
          timestamp: idleStartDate.toISOString(),
          status: 'idle',
          duration: Math.round(gapMinutes)
        });
      }

      timeline.push({
        time: toHourMinute(currentTimestamp),
        timestamp: currentTimestamp.toISOString(),
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
