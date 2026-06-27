import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState, LoginCredentials } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials, role: UserRole) => Promise<{ require_password_reset?: boolean } | void>;
  logout: () => void;
  setUserFromToken: (token: string, role: UserRole) => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'bigcompany_token';
const USER_KEY = 'bigcompany_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials, role: UserRole) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await authService.login(credentials, role);

      // Use user from response or build from credentials
      let user: User;
      if (response.user) {
        user = {
          ...response.user,
          role,
        };
      } else {
        user = {
          id: 'unknown',
          email: role === 'consumer'
            ? `${credentials.phone_number}@bigcompany.rw`
            : credentials.email || 'unknown@bigcompany.rw',
          phone: credentials.phone_number,
          role,
        };
      }

      // Ensure role is set
      user.role = role;

      if (response.require_password_reset) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        
        localStorage.setItem('temp_token', response.access_token);
        localStorage.setItem('temp_role', role);
        localStorage.setItem('temp_user', JSON.stringify(user));
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return { require_password_reset: true };
      }

      localStorage.setItem(TOKEN_KEY, response.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // Also set admin_token for admin users (for backward compatibility with admin pages)
      if (role === 'admin') {
        localStorage.setItem('admin_token', response.access_token);
      }

      setState({
        user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { require_password_reset: false };
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const setUserFromToken = (token: string, role: UserRole) => {
    // Parse JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      let user: User = {
        id: payload.id || 'unknown',
        email: payload.email || 'unknown',
        role,
        name: payload.name,
        shop_name: payload.shop_name,
        company_name: payload.company_name,
      };

      // Retrieve and merge full user details if available
      const tempUserStr = localStorage.getItem('temp_user');
      if (tempUserStr) {
        try {
          const tempUser = JSON.parse(tempUserStr);
          user = { ...user, ...tempUser };
        } catch (e) {}
        localStorage.removeItem('temp_user');
      }

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      console.error('Failed to parse token');
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setState(prev => ({
      ...prev,
      user: updatedUser
    }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setUserFromToken, updateUser }}>
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
