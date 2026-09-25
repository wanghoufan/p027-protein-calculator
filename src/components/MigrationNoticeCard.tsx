import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../i18n/I18nContext';

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
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useT();
  if (!visible) {
    return null;
  }
  return (
    <View style={[styles.card, shadows.card]} accessibilityLiveRegion="polite">
      <Text style={styles.title}>{t.migrationTitle}</Text>
      <Text style={styles.body}>{t.goalModelMigrationNotice}</Text>
      <View style={styles.buttonRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.migrationAckA11y}
          style={styles.primaryButton}
          onPress={onAcknowledge}
        >
          <Text style={styles.primaryButtonText}>{t.migrationAck}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.migrationReselectA11y}
          style={styles.secondaryButton}
          onPress={onOpenGoalPicker}
        >
          <Text style={styles.secondaryButtonText}>{t.migrationReselect}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.card,
      backgroundColor: colors.warningBg,
      padding: spacing.lg,
    },
    title: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.warningText,
    },
    body: {
      marginTop: spacing.xs,
      fontSize: 13,
      lineHeight: 19,
      color: colors.warningText,
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
}
