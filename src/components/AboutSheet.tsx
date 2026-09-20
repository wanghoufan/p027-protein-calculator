import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { spacing } from '../theme/spacing';

interface AboutSheetProps {
  visible: boolean;
  onClose: () => void;
  onClearAmounts: () => void;
  onResetOverrides: () => void;
  overrideCount: number;
}

/**
 * 齿轮真实入口（FR-020：不允许无行为按钮）：
 * 关于（名称/版本/口号/离线说明）+ 清空当前食物数量 + 恢复默认营养值。
 * 只使用现有 hook 能力：清空 = clearAmounts；恢复默认 = 逐个删除 preset override。
 */
export function AboutSheet({
  visible,
  onClose,
  onClearAmounts,
  onResetOverrides,
  overrideCount,
}: AboutSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} accessibilityLabel="关闭设置遮罩" onPress={onClose} />
        <View style={[styles.sheet, shadows.sheet]}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.title}>设置</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="关闭设置"
              hitSlop={12}
              onPress={onClose}
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.aboutCard}>
            <Text style={styles.appName}>蛋白质计算器</Text>
            <Text style={styles.version}>V1.0.0</Text>
            <Text style={styles.slogan}>吃对蛋白质，更好的自己</Text>
            <Text style={styles.desc}>
              离线单机工具，无需注册与联网；体重、食物与修改仅保存在本机。
            </Text>
          </View>

          <Text style={styles.sectionTitle}>操作</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="清空当前数量"
            style={[styles.actionButton, styles.actionClear]}
            onPress={() => {
              onClearAmounts();
              onClose();
            }}
          >
            <Text style={styles.actionClearText}>清空当前食物数量</Text>
            <Text style={styles.actionHint}>所有已添加食物的数量归 0，不删除食物</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="恢复默认营养值"
            style={[
              styles.actionButton,
              styles.actionReset,
              overrideCount === 0 && styles.actionDisabled,
            ]}
            disabled={overrideCount === 0}
            onPress={() => {
              onResetOverrides();
              onClose();
            }}
          >
            <Text
              style={[styles.actionResetText, overrideCount === 0 && styles.actionDisabledText]}
            >
              恢复默认营养值
            </Text>
            <Text style={[styles.actionHint, overrideCount === 0 && styles.actionDisabledText]}>
              {overrideCount > 0
                ? `清除 ${overrideCount} 个食物的营养值修改，不删除自定义食物`
                : '暂无已修改营养值的食物'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  close: {
    fontSize: 20,
    color: colors.textSecondary,
    minHeight: 44,
    minWidth: 44,
    textAlign: 'center',
    lineHeight: 44,
  },
  aboutCard: {
    marginTop: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.targetCard,
    padding: spacing.lg,
  },
  appName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  version: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  slogan: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  desc: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionButton: {
    borderRadius: radius.control,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  actionClear: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionReset: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  actionDisabled: {
    opacity: 0.55,
  },
  actionClearText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionResetText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  actionDisabledText: {
    color: colors.textSecondary,
  },
  actionHint: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
