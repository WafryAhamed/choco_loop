import React, { useEffect, useState, createContext, useContext } from 'react';
type Theme = 'day' | 'night' | 'system';
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export function ThemeProvider({ children }: {children: React.ReactNode;}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('chocolate-theme') as Theme;
    return saved || 'system';
  });
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (currentTheme: Theme) => {
      root.classList.remove('dark');
      let isDarkMode = false;
      if (currentTheme === 'system') {
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDarkMode = currentTheme === 'night';
      }
      if (isDarkMode) {
        root.classList.add('dark');
      }
      setIsDark(isDarkMode);
    };
    applyTheme(theme);
    // Listen for system changes if set to system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('chocolate-theme', newTheme);
    setThemeState(newTheme);
  };
  const toggleTheme = () => {
    setTheme(isDark ? 'day' : 'night');
  };
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark
      }}>
      
      {children}
    </ThemeContext.Provider>);

}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}