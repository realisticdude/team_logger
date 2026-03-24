import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

const MOCK_USERS = {
  admin: { email: 'admin@teamlogger.com', password: 'admin123', name: 'Admin User', role: 'admin' },
  user: { email: 'user@teamlogger.com', password: 'user123', name: 'John Doe', role: 'user', userId: '1' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('team-logger-auth');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('team-logger-auth', JSON.stringify(user));
    } else {
      localStorage.removeItem('team-logger-auth');
    }
  }, [user]);

  const login = async (email, password, role) => {
    try {
      const baseUrl = (import.meta?.env?.VITE_API_URL) || 'https://team-logger.onrender.com';
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      if (!data?.token || !data?.user) {
        return false;
      }
      localStorage.setItem('team-logger-token', data.token);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
