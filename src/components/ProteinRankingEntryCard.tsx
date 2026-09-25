import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette } from '../theme/colors';
import { radius } from '../theme/radius';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { useT } from '../i18n/I18nContext';

interface ProteinRankingEntryCardProps {
  onPress: () => void;
}

/**
 * 首页 Top30 排行榜入口卡（T092/FR-025/SPEC Acceptance 2）：
 * 位于主计算汇总之后、品牌装饰之前；整卡可点击，触控区域≥44dp，方案 B 视觉。
 */
export function ProteinRankingEntryCard({ onPress }: ProteinRankingEntryCardProps) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.rankingEntryA11y}
      style={({ pressed }) => [styles.card, shadows.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.trophy}>
        <Text style={styles.trophyIcon}>🏆</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{t.rankingEntryTitle}</Text>
        <Text style={styles.subtitle}>{t.rankingEntrySubtitle}</Text>
      </View>
      <Text style={styles.link}>{t.rankingLink}</Text>
    </Pressable>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      padding: spacing.lg,
      gap: spacing.md,
      minHeight: 76,
    },
    pressed: {
      opacity: 0.85,
    },
    trophy: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trophyIcon: {
      fontSize: 22,
    },
    textCol: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    link: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
  });
}
