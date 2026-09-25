import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { useTheme } from '../../theme/ThemeContext';

interface SegmentedControlProps<T extends string | number> {
  options: readonly { value: T; label: string; accessibilityLabel?: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** 统一分段选择器：系数 1.0/1.5、canonical/serving 模式切换共用。 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.row} accessibilityLabel={accessibilityLabel} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            style={[styles.segment, selected && styles.segmentSelected]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
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
      backgroundColor: colors.primarySoft,
      borderRadius: radius.control,
      padding: 3,
    },
    segment: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: radius.control - 3,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    segmentSelected: {
      backgroundColor: colors.surface,
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    labelSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
  });
}
