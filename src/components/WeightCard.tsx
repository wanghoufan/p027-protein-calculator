import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './ui/Card';
import { NumberStepper } from './ui/NumberStepper';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface WeightCardProps {
  weightKg: number | null;
  onWeightChange: (weightKg: number | null) => void;
}

/**
 * 我的体重卡（V1.5.1 / FR-039）：大数字 -/输入/+（step 1kg）。
 * 男女固定体重预设已删除（FR-039：不以固定体重教学示例作为一级表达）。
 * 体重空值/非数字/≤0 时不计算并就地提示（US1.8）。
 */
export function WeightCard({ weightKg, onWeightChange }: WeightCardProps) {
  const invalidWeight = weightKg === null || weightKg <= 0;

  return (
    <Card>
      <Text style={typography.cardTitle}>我的体重</Text>
      <View style={styles.stepperRow}>
        <View style={styles.stepper}>
          <NumberStepper
            value={invalidWeight ? 0 : weightKg}
            step={1}
            maxDecimals={1}
            accessibilityLabel="体重"
            variant="large"
            onChange={(value) => onWeightChange(value > 0 ? value : null)}
          />
        </View>
        <Text style={styles.unit}>kg</Text>
      </View>
      {invalidWeight ? <Text style={styles.error}>请输入有效体重（大于 0）</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  stepperRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepper: {
    flex: 1,
  },
  unit: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  error: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.danger,
  },
});
