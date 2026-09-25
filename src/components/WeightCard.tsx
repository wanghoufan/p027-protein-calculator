import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './ui/Card';
import { NumberStepper } from './ui/NumberStepper';
import { Palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../i18n/I18nContext';

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
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useT();
  const invalidWeight = weightKg === null || weightKg <= 0;

  return (
    <Card>
      <Text style={typography.cardTitle}>{t.myWeight}</Text>
      <View style={styles.stepperRow}>
        <View style={styles.stepper}>
          <NumberStepper
            value={invalidWeight ? 0 : weightKg}
            step={1}
            maxDecimals={1}
            accessibilityLabel={t.weightA11y}
            variant="large"
            onChange={(value) => onWeightChange(value > 0 ? value : null)}
          />
        </View>
        <Text style={styles.unit}>kg</Text>
      </View>
      {invalidWeight ? <Text style={styles.error}>{t.weightInvalid}</Text> : null}
    </Card>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
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
}
