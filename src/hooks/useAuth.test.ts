import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';

// Mock the API modules before importing the context
vi.mock('@/api', () => ({
  authApi: {
    piAuth: vi.fn(),
  },
  usersApi: {
    getMe: vi.fn().mockResolvedValue({
      id: 'test-id',
      username: 'testuser',
      name: 'Test User',
    }),
    updateMe: vi.fn(),
  },
}));

vi.mock('@/api/client', () => ({
  TOKEN_KEY: 'equal_token',
  REFRESH_TOKEN_KEY: 'equal_refresh_token',
}));

describe('AuthContext', () => {
  it('should provide auth state with initial values', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(typeof result.current.loginWithPi).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.refreshProfile).toBe('function');
    expect(typeof result.current.updateProfile).toBe('function');
    expect(typeof result.current.setToken).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should allow clearing error', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially no error
    expect(result.current.error).toBeNull();

    // clearError should be callable without throwing
    expect(() => result.current.clearError()).not.toThrow();
  });
});
