import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { ThemeMode, useTheme } from '../theme/ThemeContext';
import { fmt, useT } from '../i18n/I18nContext';

interface AboutSheetProps {
  visible: boolean;
  onClose: () => void;
  onClearAmounts: () => void;
  onResetOverrides: () => void;
  overrideCount: number;
}

/**
 * 齿轮真实入口（FR-020：不允许无行为按钮）：
 * 语言切换（Change B）+ 关于（名称/版本/口号/离线说明）+ 清空当前食物数量 + 恢复默认营养值。
 * 只使用现有 hook 能力：清空 = clearAmounts；恢复默认 = 逐个删除 preset override。
 */
export function AboutSheet({
  visible,
  onClose,
  onClearAmounts,
  onResetOverrides,
  overrideCount,
}: AboutSheetProps) {
  const { colors, shadows, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t, locale, setLocale } = useT();
  const themeOptions: readonly { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t.themeSystem },
    { value: 'light', label: t.themeLight },
    { value: 'dark', label: t.themeDark },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          accessibilityLabel={t.closeOverlayA11y}
          onPress={onClose}
        />
        <View style={[styles.sheet, shadows.sheet]}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t.settings}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.closeA11y}
              hitSlop={12}
              onPress={onClose}
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.aboutCard}>
            <Text style={styles.appName}>{t.appName}</Text>
            <Text style={styles.version}>V1.0.0</Text>
            <Text style={styles.slogan}>{t.aboutSlogan}</Text>
            <Text style={styles.desc}>{t.aboutDesc}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t.languageSection}</Text>
          <View style={styles.langRow}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: locale === 'zh' }}
              accessibilityLabel={t.langZh}
              style={[styles.langButton, locale === 'zh' && styles.langButtonSelected]}
              onPress={() => setLocale('zh')}
            >
              <Text
                style={[styles.langText, locale === 'zh' && styles.langTextSelected]}
              >
                {t.langZh}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: locale === 'en' }}
              accessibilityLabel={t.langEn}
              style={[styles.langButton, locale === 'en' && styles.langButtonSelected]}
              onPress={() => setLocale('en')}
            >
              <Text
                style={[styles.langText, locale === 'en' && styles.langTextSelected]}
              >
                English
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>{t.appearance}</Text>
          <View style={styles.langRow}>
            {themeOptions.map((option) => {
              const selected = mode === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option.label}
                  style={[styles.langButton, selected && styles.langButtonSelected]}
                  onPress={() => setMode(option.value)}
                >
                  <Text style={[styles.langText, selected && styles.langTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>{t.operations}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.clearAmountsA11y}
            style={[styles.actionButton, styles.actionClear]}
            onPress={() => {
              onClearAmounts();
              onClose();
            }}
          >
            <Text style={styles.actionClearText}>{t.clearAmountsAction}</Text>
            <Text style={styles.actionHint}>{t.clearAmountsHint}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.resetOverridesA11y}
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
              {t.resetOverridesAction}
            </Text>
            <Text style={[styles.actionHint, overrideCount === 0 && styles.actionDisabledText]}>
              {overrideCount > 0
                ? fmt(t.resetOverridesHintSome, { n: overrideCount })
                : t.resetOverridesHintNone}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
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
    langRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    langButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    langButtonSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    langText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    langTextSelected: {
      color: colors.primary,
      fontWeight: '700',
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
}
