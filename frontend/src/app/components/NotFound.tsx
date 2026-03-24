import { Link } from 'react-router';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

export function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center px-4">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} className="text-gray-400 dark:text-gray-500" />
        </div>
        <h1 className="text-6xl font-semibold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}