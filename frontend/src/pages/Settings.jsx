import { useState } from 'react';
import { Camera, Users, Clock, Database, AlertCircle, Palette, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [screenshotEnabled, setScreenshotEnabled] = useState(true);
  const [screenshotInterval, setScreenshotInterval] = useState(10);
  const [retentionDays, setRetentionDays] = useState(7);
  const [maxUsers, setMaxUsers] = useState(50);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Configure your Team Logger preferences</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Palette className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Customize the look and feel</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-base font-medium text-gray-900 dark:text-white">Theme Mode</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Switch between light and dark theme</p>
              </div>
              <div className="flex items-center gap-3">
                <Sun className={`${theme === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} size={20} />
                <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
                <Moon className={`${theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} size={20} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-base font-medium text-gray-900 dark:text-white mb-3 block">Theme Preview</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    theme === 'light' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => setTheme('light')}
                >
                  <div className="bg-white rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sun size={16} className="text-gray-900" />
                      <span className="text-sm font-medium text-gray-900">Light Mode</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-blue-100 rounded flex-1"></div>
                      <div className="h-6 bg-gray-100 rounded flex-1"></div>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    theme === 'dark' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => setTheme('dark')}
                >
                  <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Moon size={16} className="text-white" />
                      <span className="text-sm font-medium text-white">Dark Mode</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 bg-gray-700 rounded w-full"></div>
                      <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-blue-900 rounded flex-1"></div>
                      <div className="h-6 bg-gray-700 rounded flex-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Camera className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Screenshot Capture</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configure automatic screenshot settings</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-base font-medium text-gray-900 dark:text-white">Enable Screenshot Capture</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatically capture screenshots at regular intervals</p>
              </div>
              <Switch checked={screenshotEnabled} onCheckedChange={setScreenshotEnabled} />
            </div>

            {screenshotEnabled && (
              <>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Label htmlFor="interval" className="text-base font-medium text-gray-900 dark:text-white">
                    Capture Interval
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">Time between automatic screenshots</p>
                  <div className="flex items-center gap-3">
                    <Input
                      id="interval"
                      type="number"
                      min="5"
                      max="60"
                      value={screenshotInterval}
                      onChange={(e) => setScreenshotInterval(parseInt(e.target.value) || 10)}
                      className="w-24 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    />
                    <span className="text-gray-600 dark:text-gray-400">minutes</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Label htmlFor="retention" className="text-base font-medium text-gray-900 dark:text-white">
                    Storage Retention
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">How long to keep screenshots before auto-deletion</p>
                  <div className="flex items-center gap-3">
                    <Input
                      id="retention"
                      type="number"
                      min="1"
                      max="30"
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(parseInt(e.target.value) || 7)}
                      className="w-24 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    />
                    <span className="text-gray-600 dark:text-gray-400">days</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <Users className="text-green-600 dark:text-green-400" size={20} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configure user limits and permissions</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="maxUsers" className="text-base font-medium text-gray-900 dark:text-white">
                Maximum Users
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">Total number of users allowed in your organization</p>
              <div className="flex items-center gap-3">
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  max="50"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(Math.min(50, parseInt(e.target.value) || 50))}
                  className="w-24 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
                <span className="text-gray-600 dark:text-gray-400">users (max: 50)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <Database className="text-orange-600 dark:text-orange-400" size={20} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">System Information</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current system status and limits</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm md:text-base text-gray-600 dark:text-gray-400">Application Type</span>
              <span className="text-sm md:text-base font-medium text-gray-900 dark:text-white">Web-based Dashboard</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm md:text-base text-gray-600 dark:text-gray-400">Screenshot Interval</span>
              <span className="text-sm md:text-base font-medium text-gray-900 dark:text-white">{screenshotInterval} minutes</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm md:text-base text-gray-600 dark:text-gray-400">Data Retention</span>
              <span className="text-sm md:text-base font-medium text-gray-900 dark:text-white">{retentionDays} days</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm md:text-base text-gray-600 dark:text-gray-400">User Limit</span>
              <span className="text-sm md:text-base font-medium text-gray-900 dark:text-white">{maxUsers} users</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 md:p-6 flex items-start gap-3">
          <AlertCircle className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Important Notes</p>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>Screenshots are captured automatically during work hours</li>
              <li>All data is stored securely and deleted after the retention period</li>
              <li>Maximum capacity is 50 users to ensure optimal performance</li>
              <li>Changes to settings apply immediately to all users</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 md:mt-8 flex justify-end">
          <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
