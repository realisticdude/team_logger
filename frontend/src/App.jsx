import { RouterProvider, createBrowserRouter, Navigate } from 'react-router';
import Layout from './components/layout/Layout.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import UserDetail from './pages/UserDetail.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

function DashboardRouter() {
  const authStr = localStorage.getItem('team-logger-auth');
  const auth = authStr ? JSON.parse(authStr) : null;

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  if (auth.role === 'admin') {
    return (
      <ProtectedRoute requireAdmin={true}>
        <AdminDashboard />
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

const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
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
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <Settings />
          </ProtectedRoute>
        ),
      },

      { path: '*', Component: NotFound },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}
