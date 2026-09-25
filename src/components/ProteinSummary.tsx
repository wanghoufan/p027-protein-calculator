import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from './ui/ProgressBar';
import { formatProtein } from '../domain/protein';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { ProteinBalance } from '../types';
import { useT } from '../i18n/I18nContext';
import type { Dict } from '../i18n/translations';

interface ProteinSummaryProps {
  total: number;
  target: number | null;
  balance: ProteinBalance | null;
}

function balanceText(balance: ProteinBalance | null, t: Dict): string {
  if (balance === null) {
    return t.invalidWeightHint;
  }
  if (balance.type === 'remaining') {
    return `${t.stillShort} ${formatProtein(balance.amount)} g`;
  }
  if (balance.type === 'over') {
    return `${t.over} ${formatProtein(balance.amount)} g`;
  }
  return t.metGoal;
}

/**
 * 已摄入蛋白质卡（US2.9/10）：已摄入 / 目标 / 还差-超出-已达标 / 进度条。
 * 进度超过目标时视觉封顶 100%，数值仍显示真实摄入。
 */
export function ProteinSummary({ total, target, balance }: ProteinSummaryProps) {
  const { t } = useT();
  const progress = target !== null && target > 0 ? total / target : 0;
  const met = balance?.type === 'met';
  return (
    <View>
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <Text style={styles.label}>{t.intakeLabel}</Text>
          <Text style={styles.totalRow}>
            <Text style={styles.total}>{formatProtein(total)}</Text>
            <Text style={styles.totalUnit}> g</Text>
            {target !== null ? (
              <Text style={styles.targetUnit}> / {formatProtein(target)} g</Text>
            ) : null}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.balanceLabel}>
            {balance === null ? t.hintLabel : met ? t.statusLabel : t.toTargetLabel}
          </Text>
          {/* 单一 Text 节点，保证“还差 X”“超出 X”“已达标”可整体读取 */}
          <Text style={[styles.balance, met && styles.balanceMet]}>{balanceText(balance, t)}</Text>
        </View>
      </View>
      <ProgressBar progress={progress} accessibilityLabel={t.progressA11y} />
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  leftCol: {},
  rightCol: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  totalRow: {},
  total: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  totalUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  targetUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  balance: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  balanceMet: {
    color: colors.primary,
  },
});
