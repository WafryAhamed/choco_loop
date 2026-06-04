import React, { useEffect, useState, createContext, useContext } from 'react';
export interface User {
  email: string;
  name: string;
  role: string;
  avatar?: string;
}
interface AuthContextType {
  user: User | null;
  login: (email: string, name?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);
  const login = (email: string, name = 'Sarah Chen') => {
    const newUser = {
      email,
      name,
      role: 'Warehouse Manager'
    };
    localStorage.setItem('auth-token', 'mock-jwt-token-12345');
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };
  const logout = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    setUser(null);
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading
      }}>
      
      {children}
    </AuthContext.Provider>);

}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}