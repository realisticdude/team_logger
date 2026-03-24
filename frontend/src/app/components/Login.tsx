import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Mail, Shield, User, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('admin');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password, role);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (demoRole: 'admin' | 'user') => {
    if (demoRole === 'admin') {
      setEmail('admin@teamlogger.com');
      setPassword('admin123');
      setRole('admin');
    } else {
      setEmail('user@teamlogger.com');
      setPassword('user123');
      setRole('user');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            Team Logger
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selector */}
            <div>
              <Label htmlFor="role" className="dark:text-white">Login As</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'user')}>
                <SelectTrigger className="mt-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="admin" className="dark:text-white dark:focus:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="user" className="dark:text-white dark:focus:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-green-600 dark:text-green-400" />
                      <span>User</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="dark:text-white">Email Address</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="dark:text-white">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" size={18} />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">Demo Credentials:</p>
          <div className="space-y-2">
            <button
              onClick={() => fillDemoCredentials('admin')}
              className="w-full text-left bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg p-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Admin Account</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">admin@teamlogger.com / admin123</p>
            </button>
            <button
              onClick={() => fillDemoCredentials('user')}
              className="w-full text-left bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg p-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <User size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">User Account</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">user@teamlogger.com / user123</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}