import { useState,useEffect } from 'react';
import { Link } from 'react-router';
import { Search, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import { formatTime } from '../services/api.js';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [deleteUserId, setDeleteUserId] = useState(null);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  console.log('DEBUG: Current users state:', users);
  console.log('DEBUG: Filtered users:', filteredUsers);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const baseUrl = (import.meta?.env?.VITE_API_URL) || 'https://team-logger.onrender.com';
        const token = localStorage.getItem('team-logger-token');
        console.log('Fetching users from:', `${baseUrl}/api/users`);
        const res = await fetch(`${baseUrl}/api/users`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        
        if (!res.ok) {
          console.error('Fetch users failed:', res.status, res.statusText);
          if (res.status === 401) {
            console.log('Unauthorized. Clearing token and forcing re-login.');
            localStorage.removeItem('team-logger-token');
            window.location.reload(); // Force a reload to redirect to login
          }
          return;
        }
        
        const data = await res.json();
        console.log('DEBUG: Raw data received from backend:', data);
        
        if (!Array.isArray(data)) {
          console.error('DEBUG: Data received is not an array:', data);
          return;
        }
        
        const mapped = data.map((u) => {
          // Status mapping logic
          const lastSeen = u.last_seen ? new Date(u.last_seen) : null;
          const isRecent = lastSeen && (new Date() - lastSeen) < 5 * 60 * 1000;
          const status = isRecent ? (u.status === 'idle' ? 'idle' : 'online') : 'offline';

          return {
            id: u.id,
            name: u.name || 'Unknown',
            email: u.email || 'No email',
            status,
            todayTime: 0,
            productivity: 0,
            avatar: (u.name || 'U')
              .split(' ')
              .filter(Boolean)
              .map((n) => n[0])
              .join('')
              .toUpperCase(),
          };
        });
        
        console.log('DEBUG: Mapped users:', mapped);
        setUsers(mapped);
      } catch (err) {
        console.error('DEBUG: Error loading users:', err);
      }
    };
    loadUsers();

    const interval = setInterval(loadUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchAllMetrics = async () => {
      const baseUrl = (import.meta?.env?.VITE_API_URL) || 'https://team-logger.onrender.com';
      const token = localStorage.getItem('team-logger-token');
      
      const updatedUsers = await Promise.all(users.map(async (u) => {
        try {
          const res = await fetch(`${baseUrl}/api/users/${u.id}/metrics`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          if (res.ok) {
            const m = await res.json();
            return { ...u, todayTime: m.todayTime, productivity: m.productivity };
          }
        } catch (e) {}
        return u;
      }));
      
      // Only update if metrics actually changed to avoid re-renders
      setUsers(updatedUsers);
    };

    if (users.length > 0) {
      fetchAllMetrics();
    }
  }, [users.length]); // Only fetch when user list changes, or we can use a separate interval

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim() || !newUserRole.trim()) return;
    try {
      const baseUrl = (import.meta?.env?.VITE_API_URL) || 'https://team-logger.onrender.com';
      const token = localStorage.getItem('team-logger-token');
      const body = {
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
        role: newUserRole.trim(),
      };
      const res = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error('Add user failed', res.status);
        return;
      }
      
      // Refresh the entire user list from the backend to ensure data consistency
      const loadUsers = async () => {
        try {
          const res = await fetch(`${baseUrl}/api/users`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              const mapped = data.map((u) => {
                const lastSeen = u.last_seen ? new Date(u.last_seen) : null;
                const isRecent = lastSeen && (new Date() - lastSeen) < 5 * 60 * 1000;
                const status = isRecent ? (u.status === 'idle' ? 'idle' : 'online') : 'offline';
                return {
                  id: u.id,
                  name: u.name || 'Unknown',
                  email: u.email || 'No email',
                  status,
                  todayTime: 0,
                  productivity: 0,
                  avatar: (u.name || 'U').split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase(),
                };
              });
              setUsers(mapped);
            }
          }
        } catch (err) {
          console.error('Error refreshing users after add:', err);
        }
      };
      await loadUsers();

      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setIsAddDialogOpen(false);
    } catch (e) {
      console.error('Add user error', e);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      const baseUrl = (import.meta?.env?.VITE_API_URL) || 'https://team-logger.onrender.com';
      const token = localStorage.getItem('team-logger-token');
      const res = await fetch(`${baseUrl}/api/users/${deleteUserId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        console.error('Delete user failed', res.status);
        setDeleteUserId(null);
        return;
      }
      setUsers(users.filter((user) => user.id !== deleteUserId));
      setDeleteUserId(null);
    } catch (e) {
      console.error('Delete user error', e);
      setDeleteUserId(null);
    }
  };

  const onlineUsers = users.filter((u) => u.status === 'online').length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Monitor your team's activity and productivity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Users</p>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">{users.length}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Max: 50 users</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Now</p>
          <p className="text-2xl md:text-3xl font-semibold text-green-600 dark:text-green-500">{onlineUsers}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Currently working</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Offline</p>
          <p className="text-2xl md:text-3xl font-semibold text-gray-400 dark:text-gray-500">{users.length - onlineUsers}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Not active today</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4 md:p-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-white"
            />
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <UserPlus size={18} />
                <span className="hidden sm:inline">Add User</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Add New User</DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  Add a new user to monitor. Maximum 50 users allowed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Name</label>
                  <Input
                    placeholder="John Doe"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Email</label>
                  <Input
                    type="email"
                    placeholder="john@company.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Password</label>
                <Input
                  type="password"
                  placeholder="Enter a password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Role</label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v)}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto dark:border-gray-700 dark:text-gray-300">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  disabled={!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim() || !newUserRole.trim() || users.length >= 50}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery ? 'Try adjusting your search query' : 'Get started by adding your first user'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <UserPlus size={18} />
              Add Your First User
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Time Today</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Productivity</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/user/${user.id}`} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-medium">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                          user.status === 'online'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : user.status === 'inactive'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            user.status === 'online' ? 'bg-green-500 dark:bg-green-400' : user.status === 'inactive' ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-gray-400 dark:bg-gray-500'
                          }`}
                        />
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {user.todayTime > 0 ? formatTime(user.todayTime) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.productivity > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-[100px] h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                user.productivity >= 80
                                  ? 'bg-green-500 dark:bg-green-400'
                                  : user.productivity >= 60
                                  ? 'bg-yellow-500 dark:bg-yellow-400'
                                  : 'bg-red-500 dark:bg-red-400'
                              }`}
                              style={{ width: `${user.productivity}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-10">
                            {user.productivity}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteUserId(user.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <Link to={`/user/${user.id}`} className="block mb-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-medium">
                      {user.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === 'online'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : user.status === 'inactive'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'online' ? 'bg-green-500' : user.status === 'inactive' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </div>
                </Link>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time Today</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.todayTime > 0 ? formatTime(user.todayTime) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Productivity</p>
                    {user.productivity > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              user.productivity >= 80 ? 'bg-green-500' : user.productivity >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${user.productivity}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{user.productivity}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteUserId(user.id)}
                  className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete User
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {users.length >= 45 && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">Approaching user limit</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              You have {users.length} of 50 users. Consider removing inactive users.
            </p>
          </div>
        </div>
      )}

      <AlertDialog open={deleteUserId !== null} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Are you sure you want to delete this user? This action cannot be undone and all their data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto dark:border-gray-700 dark:text-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
