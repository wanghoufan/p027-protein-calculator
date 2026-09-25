import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { ProteinGoalSelection } from '../types';
import { formatCoefficient, getGoalCoefficient } from '../domain/proteinGoal';
import { formatProtein } from '../domain/protein';
import { useT } from '../i18n/I18nContext';

interface ProteinGoalSummaryCardProps {
  weightKg: number | null;
  proteinGoal: ProteinGoalSelection;
  targetProtein: number | null;
}

/**
 * 今日目标浅绿大卡（T139 / 原型首页）：目标大数字 + 模式·档位·系数 + 体重 × 系数。
 * 模式/档位变化即时重算，不清空食物记录（SC-021）。
 */
export function ProteinGoalSummaryCard({
  weightKg,
  proteinGoal,
  targetProtein,
}: ProteinGoalSummaryCardProps) {
  const { t, locale } = useT();
  const valid = targetProtein !== null && weightKg !== null;
  const copy = t.goalModes[proteinGoal.mode];
  const coefficient = getGoalCoefficient(proteinGoal.mode, proteinGoal.level);
  const levelLabel = proteinGoal.level === 'low' ? t.levelLow : t.levelHigh;
  const note = valid
    ? locale === 'en'
      ? `${copy.name} · ${levelLabel} ${formatCoefficient(coefficient)}× (${weightKg} kg)`
      : `${copy.name} · ${levelLabel} ${formatCoefficient(coefficient)}×（${weightKg} kg）`
    : t.todayTargetPlaceholder;
  return (
    <View style={[styles.card, shadows.card]} accessibilityLiveRegion="polite">
      <Text style={styles.caption}>{t.todayTarget}</Text>
      <View style={styles.numberRow}>
        {valid ? (
          <>
            <Text style={typography.targetNumber}>{formatProtein(targetProtein)}</Text>
            <Text style={styles.unit}>g</Text>
          </>
        ) : (
          <Text style={styles.placeholder}>—</Text>
        )}
      </View>
      <Text style={styles.note}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.targetCard,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  caption: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  unit: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  note: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
  },
  placeholder: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textSecondary,
  },
});
