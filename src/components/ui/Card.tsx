import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Palette } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { Shadows } from '../../theme/shadows';
import { useTheme } from '../../theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** 圆角白卡 + 轻阴影（方案 B）。 */
export function Card({ children, style }: CardProps) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(colors: Palette, shadows: Shadows) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      padding: 16,
      ...shadows.card,
    },
  });
}
