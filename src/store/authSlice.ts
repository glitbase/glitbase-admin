import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

// Load initial state from localStorage
const loadAuthFromStorage = (): Partial<AuthState> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state || {};
    }
  } catch (error) {
    console.error("Failed to load auth from storage:", error);
  }

  return {};
};

const storedAuth = loadAuthFromStorage();
const initialAuthState: AuthState = {
  ...initialState,
  ...storedAuth,
  isAuthenticated: !!(storedAuth.user && storedAuth.accessToken),
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;

      // Persist to localStorage
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: action.payload.user,
            accessToken: action.payload.accessToken,
            refreshToken: action.payload.refreshToken,
            isAuthenticated: true,
          },
        })
      );
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;

      // Update localStorage
      if (state.accessToken) {
        localStorage.setItem(
          "auth-storage",
          JSON.stringify({
            state: {
              user: action.payload,
              accessToken: state.accessToken,
              refreshToken: state.refreshToken,
              isAuthenticated: !!action.payload,
            },
          })
        );
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;

      // Clear localStorage
      localStorage.removeItem("auth-storage");
    },
  },
});

export const { setAuth, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;

