import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { spacing } from '../theme/spacing';
import { GOAL_MODEL_MIGRATION_NOTICE } from '../data/proteinGoalModes';

interface MigrationNoticeCardProps {
  visible: boolean;
  onAcknowledge: () => void;
  onOpenGoalPicker: () => void;
}

/**
 * 迁移提示卡（T143 / FR-047 / SPEC §10）：
 * legacy 1.5→1.6 变化提示，持久到用户明确关闭或进入目标选择确认；
 * 不使用瞬时 toast 作为唯一告知（banner 常驻，确认按钮 + 重新选择入口）。
 */
export function MigrationNoticeCard({
  visible,
  onAcknowledge,
  onOpenGoalPicker,
}: MigrationNoticeCardProps) {
  if (!visible) {
    return null;
  }
  return (
    <View style={[styles.card, shadows.card]} accessibilityLiveRegion="polite">
      <Text style={styles.title}>目标模式已升级</Text>
      <Text style={styles.body}>{GOAL_MODEL_MIGRATION_NOTICE}</Text>
      <View style={styles.buttonRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="确认目标模式升级提示"
          style={styles.primaryButton}
          onPress={onAcknowledge}
        >
          <Text style={styles.primaryButtonText}>知道了</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="重新选择目标模式"
          style={styles.secondaryButton}
          onPress={onOpenGoalPicker}
        >
          <Text style={styles.secondaryButtonText}>重新选择目标</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    backgroundColor: '#FBF3DF',
    padding: spacing.lg,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8A6D1F',
  },
  body: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 19,
    color: '#8A6D1F',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
