import { Platform } from 'react-native';
import { Palette } from './colors';

/**
 * 轻阴影（Android elevation + iOS shadow）。
 * Change B：阴影色跟随主题（shadowColor = colors.textPrimary），深色下为浅色投影。
 */
export function makeShadows(colors: Palette) {
  return {
    card: Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      default: {},
    }),
    sheet: Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  };
}

export type Shadows = ReturnType<typeof makeShadows>;
