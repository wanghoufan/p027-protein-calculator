import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Coefficient } from '../types';
import { formatProtein } from '../domain/protein';

interface TargetCardProps {
  weightKg: number | null;
  coefficient: Coefficient;
  targetProtein: number | null;
}

/**
 * 每日蛋白质需求浅绿大卡（US1 / SC-008）：
 * 目标大数字 + 基于体重系数说明 + 手臂图形（本地资产，方案 B 原型裁剪）。
 */
export function TargetCard({ weightKg, coefficient, targetProtein }: TargetCardProps) {
  const valid = targetProtein !== null;
  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.textCol}>
        <Text style={styles.caption}>每日蛋白质需求</Text>
        <View style={styles.numberRow}>
          {valid ? (
            <>
              <Text style={typography.targetNumber}>{formatProtein(targetProtein)}</Text>
              <Text style={styles.unit}>g / 天</Text>
            </>
          ) : (
            <Text style={styles.placeholder}>—</Text>
          )}
        </View>
        <Text style={styles.note}>
          {valid ? `基于体重 ${weightKg} kg × ${coefficient} g/kg` : '输入体重后自动计算每日目标'}
        </Text>
      </View>
      <Image
        source={require('../../assets/foods/arm.png')}
        style={styles.arm}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.targetCard,
    borderRadius: radius.card,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: '600',
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
  arm: {
    width: 82,
    height: 96,
    marginLeft: spacing.sm,
  },
});
