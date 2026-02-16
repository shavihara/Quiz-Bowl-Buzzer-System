import React, { createContext, useContext, useState } from 'react';
import { AuthState, User } from '../types';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string) => {
    // Mock login logic
    setUser({ username, role: 'admin' });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};