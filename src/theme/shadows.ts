import { Platform } from 'react-native';

/** 轻阴影（Android elevation + iOS shadow）。 */
export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#1F2A24',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 2 },
    default: {},
  }),
  sheet: Platform.select({
    ios: {
      shadowColor: '#1F2A24',
      shadowOpacity: 0.15,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -4 },
    },
    android: { elevation: 8 },
    default: {},
  }),
} as const;
