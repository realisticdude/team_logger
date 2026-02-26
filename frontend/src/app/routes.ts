import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { UserDashboard } from './components/UserDashboard';
import { UserDetail } from './components/UserDetail';
import { Settings } from './components/Settings';
import { NotFound } from './components/NotFound';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

// Wrapper to show appropriate dashboard based on role
function DashboardRouter() {
  // This will be handled by checking auth in the component
  const authStr = localStorage.getItem('team-logger-auth');
  const auth = authStr ? JSON.parse(authStr) : null;
  
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  
  if (auth.role === 'admin') {
    return (
      <ProtectedRoute requireAdmin={true}>
        <Dashboard />
      </ProtectedRoute>
    );
  } else {
    return (
      <ProtectedRoute>
        <UserDashboard />
      </ProtectedRoute>
    );
  }
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: DashboardRouter },
      { 
        path: 'user/:userId',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <UserDetail />
          </ProtectedRoute>
        )
      },
      { 
        path: 'settings',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <Settings />
          </ProtectedRoute>
        )
      },
      { path: '*', Component: NotFound }
    ]
  }
]);