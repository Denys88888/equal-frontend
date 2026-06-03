import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'equal-theme';

type ThemeMode = 'dark' | 'light';

interface UseDarkModeReturn {
  isDark: boolean;
  toggle: () => void;
  setTheme: (mode: ThemeMode) => void;
}

function getSystemPreference(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return null;
  } catch {
    return null;
  }
}

function applyTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function useDarkMode(): UseDarkModeReturn {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = getStoredTheme();
    return stored === 'dark' || (stored === null && getSystemPreference() === 'dark');
  });

  useEffect(() => {
    const mode = isDark ? 'dark' : 'light';
    applyTheme(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage might not be available
    }
  }, [isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const stored = getStoredTheme();

    const handleChange = (e: MediaQueryListEvent) => {
      if (stored === null) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setIsDark(mode === 'dark');
  }, []);

  return { isDark, toggle, setTheme };
}
