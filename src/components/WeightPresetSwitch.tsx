import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';

interface WeightPresetSwitchProps {
  weightKg: number | null;
  onPick: (weightKg: number) => void;
}

/**
 * 男/女快捷体重预设（FR-003）：男生=60kg、女生=50kg，仅修改体重。
 * 手工修改体重后进入自定义状态（两个按钮都不高亮）。
 * 视觉向原型靠拢：选中 = 绿色实底胶囊。
 */
export function WeightPresetSwitch({ weightKg, onPick }: WeightPresetSwitchProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel="男生 60kg"
        accessibilityState={{ selected: weightKg === 60 }}
        style={[styles.chip, weightKg === 60 && styles.chipSelected]}
        onPress={() => onPick(60)}
      >
        <Text style={[styles.label, weightKg === 60 && styles.labelSelected]}>男生 60 kg</Text>
      </Pressable>
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel="女生 50kg"
        accessibilityState={{ selected: weightKg === 50 }}
        style={[styles.chip, weightKg === 50 && styles.chipSelected]}
        onPress={() => onPick(50)}
      >
        <Text style={[styles.label, weightKg === 50 && styles.labelSelected]}>女生 50 kg</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.control + 4,
    backgroundColor: colors.controlBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.surface,
    fontWeight: '700',
  },
});
