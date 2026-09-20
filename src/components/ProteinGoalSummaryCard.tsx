import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { ProteinGoalSelection } from '../types';
import { PROTEIN_GOAL_MODE_COPY } from '../data/proteinGoalModes';
import { formatCoefficient, getGoalCoefficient } from '../domain/proteinGoal';
import { formatProtein } from '../domain/protein';

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
  const valid = targetProtein !== null && weightKg !== null;
  const copy = PROTEIN_GOAL_MODE_COPY[proteinGoal.mode];
  const coefficient = getGoalCoefficient(proteinGoal.mode, proteinGoal.level);
  const levelLabel = proteinGoal.level === 'low' ? '低' : '高';
  return (
    <View style={[styles.card, shadows.card]} accessibilityLiveRegion="polite">
      <Text style={styles.caption}>今日目标</Text>
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
      <Text style={styles.note}>
        {valid
          ? `${copy.name} · ${levelLabel} ${formatCoefficient(coefficient)}×（${weightKg} kg）`
          : '输入有效体重后自动计算今日目标'}
      </Text>
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
