import { useState, useMemo } from 'react';
import { Clock, Activity, Calendar } from 'lucide-react';
import { mockUsers, generateActivityTimeline, generateScreenshots, formatTime } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function UserDashboard() {
  const { user: authUser } = useAuth();
  const [timeFilter, setTimeFilter] = useState('today');

  const user = mockUsers.find((u) => u.id === authUser?.userId);
  const activityTimeline = useMemo(() => (user ? generateActivityTimeline(user.id) : []), [user]);
  const screenshots = useMemo(() => {
    if (!user) return [];
    return generateScreenshots(user.id, timeFilter === 'week' ? 7 : 1);
  }, [user, timeFilter]);

  const isActive = user?.status === 'active';

  const activeTime = activityTimeline.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.duration, 0);
  const idleTime = activityTimeline.filter((s) => s.status === 'idle').reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2">My Dashboard</h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Track your activity and productivity</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg md:text-xl font-medium flex-shrink-0">
              {user?.avatar ?? '?'}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">{user?.name ?? 'Unknown User'}</h2>
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Time Today</p>
            </div>
            <p className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
              {formatTime(user?.todayTime ?? 0)}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <Activity className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Productivity</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">{(user?.productivity ?? 0)}%</p>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                <div
                  className={`h-full rounded-full ${
                    (user?.productivity ?? 0) >= 80
                      ? 'bg-green-500 dark:bg-green-400'
                      : (user?.productivity ?? 0) >= 60
                      ? 'bg-yellow-500 dark:bg-yellow-400'
                      : 'bg-red-500 dark:bg-red-400'
                  }`}
                  style={{ width: `${(user?.productivity ?? 0)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Screenshots</p>
            </div>
            <p className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">{screenshots.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-6 md:mb-8">
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

        {activityTimeline.length === 0 ? (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-600 dark:text-gray-400">
            No activity yet
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex text-xs text-gray-400 dark:text-gray-500 mb-1">
              <span className="w-12 md:w-16">9:00</span>
              <span className="flex-1 text-center">12:00</span>
              <span className="w-12 md:w-16 text-right">17:00</span>
            </div>

            <div className="relative h-10 md:h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {activityTimeline.map((segment, index) => {
                const startMinutes = parseInt(segment.time.split(':')[0]) * 60 + parseInt(segment.time.split(':')[1]);
                const dayStart = 9 * 60;
                const dayEnd = 17 * 60;
                const dayDuration = dayEnd - dayStart;
                const left = ((startMinutes - dayStart) / dayDuration) * 100;
                const width = (segment.duration / dayDuration) * 100;

                return (
                  <div
                    key={index}
                    className={`absolute top-0 h-full ${segment.status === 'active' ? 'bg-green-500 dark:bg-green-400' : 'bg-red-400 dark:bg-red-500'}`}
                    style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` }}
                    title={`${segment.time} - ${segment.status} (${segment.duration}m)`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">My Screenshots</h2>
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

        {screenshots.length === 0 ? (
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
            {screenshots.slice(0, 48).map((screenshot) => (
              <div key={screenshot.id} className="group relative">
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  <img
                    src={screenshot.imageUrl}
                    alt={`Screenshot at ${screenshot.timestamp.toLocaleTimeString()}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {screenshot.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p>{screenshot.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
