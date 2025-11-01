import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type ColorPalette = 'blue' | 'green' | 'purple' | 'orange' | 'red';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultPalette?: ColorPalette;
  storageKey?: string;
  paletteStorageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  palette: ColorPalette;
  setTheme: (theme: Theme) => void;
  setPalette: (palette: ColorPalette) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  palette: 'blue',
  setTheme: () => null,
  setPalette: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultPalette = 'blue',
  storageKey = 'vite-ui-theme',
  paletteStorageKey = 'vite-ui-palette',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [palette, setPalette] = useState<ColorPalette>(
    () => (localStorage.getItem(paletteStorageKey) as ColorPalette) || defaultPalette
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all palette classes
    root.classList.remove('palette-blue', 'palette-green', 'palette-purple', 'palette-orange', 'palette-red');

    // Add current palette class
    root.classList.add(`palette-${palette}`);
  }, [palette]);

  const value = {
    theme,
    palette,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    setPalette: (palette: ColorPalette) => {
      localStorage.setItem(paletteStorageKey, palette);
      setPalette(palette);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
