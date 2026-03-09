import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Users, Settings, Menu, X, LogOut, Shield, User as UserIcon, ChevronDown, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const adminNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/', icon: Users, label: 'Users', highlight: location.pathname.startsWith('/user/') },
    { path: '/settings', icon: Settings, label: 'Settings', exact: false },
  ];

  const userNavItems = [{ path: '/', icon: LayoutDashboard, label: 'My Dashboard', exact: true }];
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Team Logger</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Monitor & Track</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">
                  {user?.name.charAt(0)}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuLabel className="dark:text-white">
                <div className="flex items-center gap-2">
                  {isAdmin ? <Shield size={16} className="text-blue-600 dark:text-blue-400" /> : <UserIcon size={16} className="text-green-600 dark:text-green-400" />}
                  <span>{isAdmin ? 'Admin' : 'User'}</span>
                </div>
                <p className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-gray-700" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 dark:focus:bg-gray-700">
                <LogOut size={16} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
          flex flex-col transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 hidden lg:block">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Team Logger</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor & Track</p>
        </div>

        <div className="hidden lg:block px-4 pt-4">
          <div
            className={`rounded-lg p-3 ${
              isAdmin
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30'
                : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <>
                  <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Logged in as Admin</span>
                </>
              ) : (
                <>
                  <UserIcon size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-300">Logged in as User</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-20 lg:mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                (item.exact ? isActive(item.path) : item.highlight || isActive(item.path))
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>

          {isAdmin && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs text-blue-900 dark:text-blue-300 font-medium">Storage Info</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Screenshots stored for 7 days only</p>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto mt-20 lg:mt-0">
        <div className="hidden lg:flex justify-end p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2" variant="ghost">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">
                  {user?.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{isAdmin ? 'Administrator' : 'User'}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuLabel className="dark:text-white">
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                  ) : (
                    <UserIcon size={16} className="text-green-600 dark:text-green-400" />
                  )}
                  <span>{isAdmin ? 'Admin Account' : 'User Account'}</span>
                </div>
                <p className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-gray-700" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 dark:focus:bg-gray-700">
                <LogOut size={16} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
