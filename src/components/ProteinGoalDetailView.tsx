import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { ProteinGoalMode } from '../types';
import { useT } from '../i18n/I18nContext';
import { getGoalCoefficient } from '../domain/proteinGoal';

interface ProteinGoalDetailViewProps {
  visible: boolean;
  mode: ProteinGoalMode | null;
  onClose: () => void;
}

/**
 * 模式说明页（T141 / US9 / FR-040~042 / 原型屏3）：
 * 双卡（low/high）+ 适用场景 + 为什么是这个范围 + 来源 + 高档提醒 + 通用健康边界。
 * 归因规则：产品化映射表述，不写“官方规定”（Principle III）。
 */
export function ProteinGoalDetailView({ visible, mode, onClose }: ProteinGoalDetailViewProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useT();
  if (!mode) {
    return null;
  }
  const copy = t.goalModes[mode];
  const range = {
    low: getGoalCoefficient(mode, 'low'),
    high: getGoalCoefficient(mode, 'high'),
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          accessibilityLabel={t.detailOverlayA11y}
          onPress={onClose}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={[styles.headerRow, { paddingTop: insets.top + spacing.md }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.backA11y}
              hitSlop={12}
              style={styles.backButton}
              onPress={onClose}
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <Text style={styles.title}>{t.goalDetailTitle}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            <View style={styles.modeHero}>
              <Text style={styles.modeName}>{copy.name}</Text>
              <Text style={styles.modeTagline}>{copy.tagline}</Text>
            </View>

            <View style={styles.levelRow}>
              <View style={styles.levelCard}>
                <Text style={styles.levelLabel}>{t.lowTier}</Text>
                <Text style={styles.levelValue}>{range.low} {t.perDayUnit}</Text>
              </View>
              <View style={[styles.levelCard, styles.levelCardHigh]}>
                <Text style={styles.levelLabel}>{t.highTier}</Text>
                <Text style={[styles.levelValue, styles.levelValueHigh]}>{range.high} {t.perDayUnit}</Text>
              </View>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionIcon}>⚙</Text>
              <View style={styles.sectionBody}>
                <Text style={styles.sectionTitle}>{t.scenarioTitle}</Text>
                <Text style={styles.sectionText}>{copy.scenario}</Text>
              </View>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionIcon}>☀</Text>
              <View style={styles.sectionBody}>
                <Text style={styles.sectionTitle}>{t.rationaleTitle}</Text>
                <Text style={styles.sectionText}>{copy.rationale}</Text>
              </View>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionIcon}>▤</Text>
              <View style={styles.sectionBody}>
                <Text style={styles.sectionTitle}>{t.sourcesTitle}</Text>
                {copy.sources.map((source) => (
                  <Text key={source} style={styles.sourceItem}>
                    · {source}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.reminderBox}>
              <Text style={styles.reminderText}>ⓘ {t.highLevelReminder}</Text>
            </View>

            <View style={styles.boundaryBox}>
              {t.healthBoundaryLines.map((line) => (
                <Text key={line} style={styles.boundaryText}>
                  {line}
                </Text>
              ))}
            </View>
          </ScrollView>
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
      flex: 1,
      backgroundColor: colors.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    backButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backText: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: -2,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 48,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    modeHero: {
      borderRadius: radius.card,
      backgroundColor: colors.primarySoft,
      padding: spacing.lg,
    },
    modeName: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modeTagline: {
      marginTop: spacing.xs,
      fontSize: 13,
      color: colors.textSecondary,
    },
    levelRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
    },
    levelCard: {
      flex: 1,
      borderRadius: radius.card,
      backgroundColor: colors.targetCard,
      padding: spacing.lg,
      alignItems: 'center',
    },
    levelCardHigh: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    levelLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    levelValue: {
      marginTop: spacing.xs,
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    levelValueHigh: {
      color: colors.primary,
    },
    sectionRow: {
      flexDirection: 'row',
      marginTop: spacing.lg,
    },
    sectionIcon: {
      fontSize: 16,
      color: colors.primary,
      marginRight: spacing.md,
      minHeight: 22,
    },
    sectionBody: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    sectionText: {
      marginTop: spacing.xs,
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    sourceItem: {
      marginTop: spacing.xs,
      fontSize: 13,
      color: colors.textSecondary,
    },
    reminderBox: {
      marginTop: spacing.lg,
      borderRadius: radius.card,
      backgroundColor: colors.warningBg,
      padding: spacing.md,
    },
    reminderText: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.warningText,
      fontWeight: '600',
    },
    boundaryBox: {
      marginTop: spacing.md,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    boundaryText: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
  });
}
