import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { ProteinGoalLevel, ProteinGoalMode } from '../types';
import { useT } from '../i18n/I18nContext';
import { formatCoefficient, getGoalCoefficient } from '../domain/proteinGoal';

interface ProteinGoalModeSelectorProps {
  mode: ProteinGoalMode;
  onSelectMode: (mode: ProteinGoalMode) => void;
}

/**
 * 首页四模式一级选择（T138 / FR-037/FR-039）：
 * 模式为一级概念、系数二级；选中 = 绿色实底 + 加粗（非纯颜色，附带 accessibilityState）。
 */
export function ProteinGoalModeSelector({ mode, onSelectMode }: ProteinGoalModeSelectorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useT();
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={t.goalModeA11y}>
      {t.goalModes &&
        (Object.keys(t.goalModes) as ProteinGoalMode[]).map((modeId) => {
          const selected = modeId === mode;
          return (
            <Pressable
              key={modeId}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t.goalModes[modeId].name}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onSelectMode(modeId)}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextSelected]}
                numberOfLines={1}
              >
                {t.goalModes[modeId].name}
              </Text>
            </Pressable>
          );
        })}
    </View>
  );
}

interface ProteinGoalLevelSelectorProps {
  mode: ProteinGoalMode;
  level: ProteinGoalLevel;
  onSelectLevel: (level: ProteinGoalLevel) => void;
}

/**
 * 低/高档选择（T138 / SPEC：档位按钮同时显示档位和系数，如「低 1.6×」）。
 */
export function ProteinGoalLevelSelector({
  mode,
  level,
  onSelectLevel,
}: ProteinGoalLevelSelectorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useT();
  const levels: readonly { value: ProteinGoalLevel; label: string }[] = [
    { value: 'low', label: t.levelLow },
    { value: 'high', label: t.levelHigh },
  ];
  return (
    <View style={styles.levelRow} accessibilityRole="radiogroup" accessibilityLabel={t.goalLevelA11y}>
      {levels.map(({ value, label }) => {
        const selected = value === level;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${value === 'low' ? t.lowTier : t.highTier} ${formatCoefficient(getGoalCoefficient(mode, value))} ${t.timesWord}`}
            style={[styles.levelChip, selected && styles.levelChipSelected]}
            onPress={() => onSelectLevel(value)}
          >
            <Text style={[styles.levelText, selected && styles.levelTextSelected]}>
              {label} {formatCoefficient(getGoalCoefficient(mode, value))}×
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 8,
    },
    chip: {
      flex: 1,
      minHeight: 48,
      borderRadius: radius.control,
      backgroundColor: colors.controlBg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    chipSelected: {
      backgroundColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chipTextSelected: {
      color: colors.surface,
      fontWeight: '700',
    },
    levelRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: spacing.sm,
    },
    levelChip: {
      flex: 1,
      minHeight: 48,
      borderRadius: radius.control + 4,
      backgroundColor: colors.controlBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    levelChipSelected: {
      backgroundColor: colors.primary,
    },
    levelText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    levelTextSelected: {
      color: colors.surface,
      fontWeight: '800',
    },
  });
}
