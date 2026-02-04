import { createContext, useContext, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@/types/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAuth, setUser, clearAuth } from "@/store/authSlice";
import { login as loginApi, getProfile, logout as logoutApi } from "@/services/authApi";
import { setAuthToken, setRefreshToken, removeAuthToken } from "@/services/baseQuery";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, accessToken, refreshToken } = useAppSelector(
    (state) => state.auth
  );

  // Initialize token from store on mount
  useEffect(() => {
    if (accessToken) {
      setAuthToken(accessToken);
    }
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }
  }, [accessToken, refreshToken]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await loginApi({ email, password });
      
      if (response.status && response.data) {
        const { user, tokens } = response.data;
        
        // Store tokens in Redux store
        dispatch(setAuth({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }));
        
        // Store tokens in localStorage for baseQuery
        setAuthToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout API if authenticated
      if (isAuthenticated) {
        await logoutApi();
      }
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with logout even if API call fails
    } finally {
      // Clear auth state
      dispatch(clearAuth());
      removeAuthToken();
      navigate("/login");
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await getProfile();
      if (response.status && response.data) {
        dispatch(setUser(response.data));
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
      // If profile fetch fails, user might be logged out
      dispatch(clearAuth());
      removeAuthToken();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
