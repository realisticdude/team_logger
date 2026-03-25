import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Clock, Activity, Calendar } from 'lucide-react';
import { formatTime } from '../services/api.js';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function UserDetail() {
  const { userId } = useParams();
  const [timeFilter, setTimeFilter] = useState('today');
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({ todayTime: 0, productivity: 0, screenshotsCount: 0 });
  const [activity, setActivity] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const baseUrl = (import.meta?.env?.VITE_API_URL) || 'https://team-logger.onrender.com';
        const token = localStorage.getItem('team-logger-token');
        const res = await fetch(`${baseUrl}/api/users/${userId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        setUser(data || null);



        const fetchActivity = async () => {
          const r = await fetch(`${baseUrl}/api/activity/${userId}/today`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          });
          if (r.ok) {
            const d = await r.json();
            setMetrics({ todayTime: d.timeTracked, productivity: d.productivity, screenshotsCount: metrics.screenshotsCount });
            setActivity(Array.isArray(d.timeline) ? d.timeline : []);
          }
        };

        const fetchScreenshots = async () => {
          const r = await fetch(`${baseUrl}/api/screenshots/user/${userId}?days=7`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          });
          if (r.ok) {
            const d = await r.json();
            setScreenshots(Array.isArray(d) ? d : []);
          }
        };

        fetchActivity();
        fetchScreenshots();
      } catch {}
    };
    loadUser();
  }, [userId]);

  const filteredScreenshots = useMemo(() => {
    if (!screenshots) return [];
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (timeFilter === 'today') {
      return screenshots.filter(s => {
        const d = new Date(s.timestamp).getTime();
        return d >= startOfToday;
      });
    } else {
      // Last 7 days
      const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
      return screenshots.filter(s => {
        const d = new Date(s.timestamp).getTime();
        return d >= sevenDaysAgo;
      });
    }
  }, [screenshots, timeFilter]);

  const isActive = user?.status === 'active';

  const activeTime = activity.filter((s) => s.status === 'active').reduce((sum, s) => sum + (s.duration || 0), 0);
  const idleTime = activity.filter((s) => s.status === 'idle').reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalTime = activeTime + idleTime;

  const avatarContent = useMemo(() => {
    if (!user) return '?';
    if (user.role === 'admin') return <Shield size={24} />;
    return (user.name || 'U').split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase();
  }, [user]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 md:mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg md:text-xl font-medium flex-shrink-0">
              {avatarContent}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">{user?.name ?? 'Unknown User'}</h1>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">{user?.email ?? '—'}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full font-medium text-sm ${
              isActive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <span
              className={`w-2 md:w-2.5 h-2 md:h-2.5 rounded-full ${
                isActive ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-400 dark:bg-gray-500'
              }`}
            />
            {isActive ? 'Active Now' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Time</p>
          </div>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">{formatTime(activeTime)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Clock className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Time</p>
          </div>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">{formatTime(totalTime)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <Activity className="text-green-600 dark:text-green-400" size={20} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Productivity</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">{(metrics.productivity || 0)}%</p>
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-[120px]">
              <div
                className={`h-full rounded-full ${
                  (metrics.productivity || 0) >= 80 ? 'bg-green-500 dark:bg-green-400' : (metrics.productivity || 0) >= 60 ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-red-500 dark:bg-red-400'
                }`}
                style={{ width: `${(metrics.productivity || 0)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Calendar className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Screenshots</p>
          </div>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">{filteredScreenshots.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {timeFilter === 'today' ? 'Today' : 'Last 7 days'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Activity Timeline</h2>

        <div className="mb-4 flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 dark:bg-green-400 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Active: {formatTime(activeTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 md:w-4 md:h-4 bg-red-400 dark:bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Idle: {formatTime(idleTime)}</span>
          </div>
        </div>

        {activity.length === 0 ? (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-600 dark:text-gray-400">
            No activity yet
          </div>
        ) : (
          <div className="space-y-2">
            {(() => {
              const getMinutes = (timeValue) => {
                if (!timeValue) return 0;
                // Handle legacy HH:mm format
                if (typeof timeValue === 'string' && timeValue.includes(':') && !timeValue.includes('T') && !timeValue.includes('-')) {
                  const [h, m] = timeValue.split(':').map(Number);
                  return (h || 0) * 60 + (m || 0);
                }
                const date = new Date(timeValue);
                if (isNaN(date.getTime())) return 0;
                return date.getHours() * 60 + date.getMinutes();
              };

              const formatMinutes = (totalMinutes) => {
                const h = Math.floor(totalMinutes / 60) % 24;
                const m = totalMinutes % 60;
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              };

              // Use all activity returned by the "today" API
              const timelineData = activity;

              // Determine dynamic start time from activity data
              const firstSegmentMinutes = getMinutes(timelineData[0].time);
              // Add 10 mins buffer
              const dayStart = Math.max(0, firstSegmentMinutes - 10);
              
              // End time is either the last activity end or current time
              const lastSegment = timelineData[timelineData.length - 1];
              const lastActivityEnd = getMinutes(lastSegment.time) + (lastSegment.duration || 0);
              const now = new Date();
              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              const dayEnd = Math.max(lastActivityEnd, currentMinutes) + 10;
              
              const dayDuration = Math.max(1, dayEnd - dayStart);

              // Generate dynamic labels every 2-3 hours
              const labels = [];
              const labelInterval = dayDuration > 600 ? 180 : 120;
              for (let t = dayStart; t <= dayEnd; t += labelInterval) {
                labels.push(formatMinutes(t));
              }
              if (labels.length > 0 && dayEnd - getMinutes(labels[labels.length - 1]) > 30) {
                labels.push(formatMinutes(dayEnd));
              }

              return (
                <>
                  <div className="flex text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-1 justify-between px-1 font-medium">
                    {labels.map((label, i) => (
                      <span key={i}>{label}</span>
                    ))}
                  </div>

                  <div className="relative h-10 md:h-12 bg-red-400/10 dark:bg-red-500/5 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                    {/* Render idle background for the entire range */}
                    <div className="absolute inset-0 bg-red-400 dark:bg-red-500 opacity-20" />
                    
                    {timelineData.map((segment, index) => {
                      const startMinutes = getMinutes(segment.time);
                      const left = ((startMinutes - dayStart) / dayDuration) * 100;
                      const width = ((segment.duration || 0) / dayDuration) * 100;

                      // Skip invalid segments
                      if (isNaN(left) || isNaN(width) || width <= 0) return null;

                      const displayTime = segment.time && segment.time.includes('T') 
                        ? new Date(segment.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : segment.time;

                      return (
                        <div
                          key={index}
                          className={`absolute top-0 h-full transition-all duration-300 ${segment.status === 'active' ? 'bg-green-500 dark:bg-green-400' : 'bg-red-400 dark:bg-red-500'}`}
                          style={{ 
                            left: `${Math.max(0, Math.min(100, left))}%`, 
                            width: `${Math.max(0, Math.min(100 - left, width))}%`,
                            zIndex: segment.status === 'active' ? 2 : 1
                          }}
                          title={`${displayTime} - ${segment.status} (${segment.duration || 0}m)`}
                        />
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Screenshots</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Auto-captured every 10 minutes</p>
          </div>

          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v)}>
            <TabsList className="dark:bg-gray-900">
              <TabsTrigger value="today" className="dark:data-[state=active]:bg-gray-700 dark:text-gray-400 dark:data-[state=active]:text-white">
                Today
              </TabsTrigger>
              <TabsTrigger value="week" className="dark:data-[state=active]:bg-gray-700 dark:text-gray-400 dark:data-[state=active]:text-white">
                Last 7 Days
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Activity className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Screenshot Retention Policy</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Screenshots are automatically deleted after 7 days to save storage space.</p>
          </div>
        </div>

        {filteredScreenshots.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-gray-400 dark:text-gray-500 md:w-8 md:h-8" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-2">No screenshots yet</h3>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
              {isActive ? 'Screenshots will appear here as they are captured.' : 'No screenshots available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredScreenshots.slice(0, 48).map((screenshot) => (
              <div key={screenshot.id} className="group relative">
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  <img
                    src={screenshot.image_url}
                    alt={`Screenshot at ${new Date(screenshot.timestamp).toLocaleTimeString()}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedImage(screenshot.image_url)}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {new Date(screenshot.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p>{new Date(screenshot.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} className="modal-image" />
        </div>
      )}
    </div>
  );
}
