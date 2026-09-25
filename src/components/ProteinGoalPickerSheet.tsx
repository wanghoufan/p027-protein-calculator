import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { spacing } from '../theme/spacing';
import { ProteinGoalLevel, ProteinGoalMode, ProteinGoalSelection } from '../types';
import { fmt, useT } from '../i18n/I18nContext';
import { getGoalCoefficient } from '../domain/proteinGoal';

interface ProteinGoalPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  selection: ProteinGoalSelection;
  onSelect: (mode: ProteinGoalMode, level: ProteinGoalLevel) => void;
}

/**
 * 目标选择 Bottom Sheet（T140 / US9 / 原型屏2）：
 * 四模式纵向卡片：模式名 + low–high 范围 + 一句适用说明 + 当前高亮（✓，非纯颜色）。
 * Android Back 走 onRequestClose；触控目标 ≥48dp；小屏可滚动。
 */
export function ProteinGoalPickerSheet({
  visible,
  onClose,
  selection,
  onSelect,
}: ProteinGoalPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const { t } = useT();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          accessibilityLabel={t.goalPickerOverlayA11y}
          onPress={onClose}
        />
        <View style={[styles.sheet, shadows.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t.goalPickerTitle}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.goalPickerCloseA11y}
              hitSlop={12}
              onPress={onClose}
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView bounces={false} style={styles.list}>
            {(Object.keys(t.goalModes) as ProteinGoalMode[]).map((modeId) => {
              const copy = t.goalModes[modeId];
              const range = {
                low: getGoalCoefficient(modeId, 'low'),
                high: getGoalCoefficient(modeId, 'high'),
              };
              const selected = selection.mode === modeId;
              return (
                <Pressable
                  key={modeId}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={fmt(t.goalRangeA11y, { name: copy.name, low: range.low, high: range.high })}
                  style={[styles.modeCard, selected && styles.modeCardSelected]}
                  onPress={() => onSelect(modeId, selection.level)}
                >
                  <View style={styles.modeTextCol}>
                    <View style={styles.modeTitleRow}>
                      <Text style={styles.modeName}>{copy.name}</Text>
                      <Text style={styles.modeRange}>
                        {range.low.toFixed(1)} – {range.high.toFixed(1)}
                      </Text>
                    </View>
                    <Text style={styles.modeTagline}>{copy.tagline}</Text>
                  </View>
                  <View style={[styles.checkBadge, selected ? styles.checkOn : styles.checkOff]}>
                    <Text
                      style={[
                        styles.checkText,
                        selected ? styles.checkTextOn : styles.checkTextOff,
                      ]}
                    >
                      ✓
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
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
    maxHeight: '80%',
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
    minHeight: 48,
    minWidth: 48,
    textAlign: 'center',
    lineHeight: 48,
  },
  list: {
    marginTop: spacing.md,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 76,
  },
  modeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  modeTextCol: {
    flex: 1,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  modeName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modeRange: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  modeTagline: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.primary,
  },
  checkOff: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '800',
  },
  checkTextOn: {
    color: colors.surface,
  },
  checkTextOff: {
    color: 'transparent',
  },
});
