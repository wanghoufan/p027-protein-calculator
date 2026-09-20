import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { Coefficient } from '../types';

interface CoefficientSelectorProps {
  coefficient: Coefficient;
  onChange: (coefficient: Coefficient) => void;
}

const OPTIONS = [
  { value: 1.0 as Coefficient, label: '基础估算 1.0 g/kg', valueText: '1.0', caption: '基础估算' },
  { value: 1.5 as Coefficient, label: '健身估算 1.5 g/kg', valueText: '1.5', caption: '健身估算' },
];

/**
 * 系数选择（FR-002）：V1 只提供 1.0 与 1.5 g/kg。
 * 视觉向原型靠拢：两档胶囊卡，选中 = 绿色实底白字；无障碍标签保持 "基础估算 1.0 g/kg" 全文。
 */
export function CoefficientSelector({ coefficient, onChange }: CoefficientSelectorProps) {
  return (
    <View style={styles.row} accessibilityLabel="蛋白质系数" accessibilityRole="radiogroup">
      {OPTIONS.map((option) => {
        const selected = option.value === coefficient;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[styles.capsule, selected && styles.capsuleSelected]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.value, selected && styles.valueSelected]}>{option.valueText}</Text>
            <Text style={[styles.caption, selected && styles.captionSelected]}>
              {option.caption}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  capsule: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.control + 4,
    backgroundColor: colors.controlBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  capsuleSelected: {
    backgroundColor: colors.primary,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  valueSelected: {
    color: colors.surface,
  },
  caption: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  captionSelected: {
    color: colors.surface,
  },
});
