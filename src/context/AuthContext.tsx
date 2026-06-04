/**
 * Equal Dating App — Authentication Context
 *
 * Provides global auth state: user profile, Pi login/logout/update helpers,
 * and automatic profile hydration when a stored JWT token exists.
 *
 * Wrap your app tree with `<AuthProvider>` in main.tsx (see integration notes below).
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api/client';
import { authApi, usersApi } from '@/api';
import type { User, UserProfile } from '@/api/types';

// ───────────────────────────────────────────────────────────
// AUTH STATE SHAPE
// ───────────────────────────────────────────────────────────

export interface AuthState {
  /** The lightweight user record returned by auth endpoints */
  user: User | null;
  /** The full user profile (hydrated after login or on mount) */
  profile: UserProfile | null;
  /** True while the initial profile fetch or a login mutation is in flight */
  isLoading: boolean;
  /** True when both a user and profile are present */
  isAuthenticated: boolean;
  /** Error from the most recent auth operation */
  error: string | null;
}

export interface AuthActions {
  /**
   * Log in via Pi Network — the ONLY authentication method.
   * @param accessToken — token from `Pi.authenticate()`
   * @param scopes      — granted scopes
   */
  loginWithPi: (accessToken: string, scopes: string[]) => Promise<void>;

  /** Clear auth state and redirect to welcome screen */
  logout: () => void;

  /** Refresh the user profile from the server */
  refreshProfile: () => Promise<void>;

  /**
   * Update fields on the current user's profile.
   * Mutates local state immediately and syncs with the server.
   */
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;

  /** Manually set the JWT token (e.g. after Pi redirect with token in URL) */
  setToken: (token: string) => void;

  /** Clear any active error message */
  clearError: () => void;
}

// ───────────────────────────────────────────────────────────
// CONTEXT
// ───────────────────────────────────────────────────────────

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

/** Hook to access auth state and actions. Must be used inside `<AuthProvider>`. */
export function useAuth(): AuthState & AuthActions {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
}

// ───────────────────────────────────────────────────────────
// PROVIDER PROPS
// ───────────────────────────────────────────────────────────

export interface AuthProviderProps {
  children: React.ReactNode;
}

// ───────────────────────────────────────────────────────────
// PROVIDER COMPONENT
// ───────────────────────────────────────────────────────────

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  const isAuthenticated = !!user && !!profile;

  // ── Hydrate profile from stored token on mount ──────────

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Hydrate: fetch profile silently
    usersApi
      .getMe()
      .then((profileData) => {
        setProfile(profileData);
        // Reconstruct a minimal User record from profile
        setUser({
          id: profileData.id,
          username: profileData.username,
          authType: 'pi', // best guess — backend doesn't expose authType on /me
        });
      })
      .catch((err: { status?: number }) => {
        // If the token expired or is invalid, clear everything
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // ── Internal: persist token and hydrate profile ─────────

  const handleAuthResponse = useCallback(
    async (response: { token: string; user: User }): Promise<void> => {
      localStorage.setItem(TOKEN_KEY, response.token);
      setUser(response.user);

      // Immediately fetch full profile
      const profileData = await usersApi.getMe();
      setProfile(profileData);
    },
    [],
  );

  // ── Actions ──────────────────────────────────────────────

  const loginWithPi = useCallback(
    async (accessToken: string, scopes: string[]): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authApi.piAuth(accessToken, scopes);
        await handleAuthResponse(response);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Pi authentication failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthResponse],
  );

  const logout = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    setProfile(null);
    setError(null);
    // Hard-navigate to welcome screen so all state resets
    window.location.href = '/';
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const profileData = await usersApi.getMe();
      setProfile(profileData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to refresh profile';
      setError(message);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>): Promise<void> => {
      // Optimistic local update
      setProfile((prev: UserProfile | null) => (prev ? { ...prev, ...patch } : prev));
      try {
        const updated = await usersApi.updateMe(patch);
        setProfile(updated);
      } catch (err: unknown) {
        // Revert on failure — re-fetch from server
        await refreshProfile();
        const message = err instanceof Error ? err.message : 'Profile update failed';
        setError(message);
        throw err;
      }
    },
    [refreshProfile],
  );

  const setToken = useCallback((token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // ── Render ───────────────────────────────────────────────

  const value: AuthState & AuthActions = {
    user,
    profile,
    isLoading,
    isAuthenticated,
    error,
    loginWithPi,
    logout,
    refreshProfile,
    updateProfile,
    setToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ───────────────────────────────────────────────────────────
// INTEGRATION NOTES
// ───────────────────────────────────────────────────────────
//
// 1. Wrap the router in main.tsx:
//
//    import { AuthProvider } from '@/context/AuthContext';
//
//    createRoot(document.getElementById('root')!).render(
//      <HashRouter>
//        <AuthProvider>
//          <ToastProvider>
//            <App />
//          </ToastProvider>
//        </AuthProvider>
//      </HashRouter>,
//    );
//
// 2. Use in any component:
//
//    import { useAuth } from '@/context/AuthContext';
//
//    function Profile() {
//      const { user, profile, isAuthenticated, logout, updateProfile } = useAuth();
//      // ...
//    }
//
// 3. Conditional route guard (example):
//
//    {isAuthenticated ? <Discover /> : <Navigate to="/" />}
//
// ───────────────────────────────────────────────────────────
