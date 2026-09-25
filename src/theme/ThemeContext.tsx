import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, Palette } from './colors';
import { makeShadows, Shadows } from './shadows';
import { makeTypography, Typography } from './typography';

/**
 * Change B：外观状态独立于业务 schema（v1/v2 迁移不感知）。
 * - 三档：system（跟随系统，默认）/ light / dark；
 * - 持久化：独立 AsyncStorage 键 `themeMode`，坏值/读取失败一律回退 system；
 * - system 时用 RN useColorScheme 解析实际明暗；
 * - 无 Provider 回退 light（既有测试与渐进接入不破坏）；
 * - 切换即时生效：context value 变化触发全量重渲染。
 */
export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'themeMode';

export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: Palette;
  shadows: Shadows;
  typography: Typography;
  isDark: boolean;
}

const lightValue: ThemeContextValue = {
  mode: 'system',
  setMode: () => undefined,
  colors: lightColors,
  shadows: makeShadows(lightColors),
  typography: makeTypography(lightColors),
  isDark: false,
};

const ThemeContext = createContext<ThemeContextValue>(lightValue);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const systemScheme = useColorScheme();

  // 启动时读取持久化外观偏好；坏值/读取失败一律回退 system。
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((raw) => {
        if (!cancelled && (raw === 'system' || raw === 'light' || raw === 'dark')) {
          setModeState(raw);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => undefined);
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      colors,
      shadows: makeShadows(colors),
      typography: makeTypography(colors),
      isDark,
    }),
    [mode, colors, isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
