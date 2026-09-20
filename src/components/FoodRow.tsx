import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NumberStepper } from './ui/NumberStepper';
import { SegmentedControl } from './ui/SegmentedControl';
import { FoodIcon } from './ui/FoodIcon';
import { calculateFoodProtein, formatProtein } from '../domain/protein';
import { getCanonicalStep, getDisplayQuantity, SERVING_STEP } from '../domain/units';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { FoodDefinition, SelectedFood } from '../types';

interface FoodRowProps {
  food: FoodDefinition;
  selected: SelectedFood;
  onAmountCanonical: (amount: number) => void;
  onAmountServing: (servingId: string, count: number) => void;
  onInputModeChange: (mode: SelectedFood['inputMode']) => void;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * 当前食物行（US2）：缩略图、名称、营养基准、canonical/serving 模式、步长输入、贡献蛋白质。
 * canonical amount 是唯一计算真相；模式切换只改展示/输入（FR-008）。
 */
export function FoodRow({
  food,
  selected,
  onAmountCanonical,
  onAmountServing,
  onInputModeChange,
  onEdit,
  onRemove,
}: FoodRowProps) {
  const serving =
    food.servingOptions.find((option) => option.id === selected.servingId) ??
    food.servingOptions[0];
  const displayValue = getDisplayQuantity(selected, serving);
  const step =
    selected.inputMode === 'serving' ? SERVING_STEP : getCanonicalStep(food.canonicalType);
  const contribution = formatProtein(calculateFoodProtein(food, selected.amountInCanonicalUnit));
  const baseText = `${formatProtein(food.proteinPerBase)}g/${food.baseAmount}${food.canonicalUnit}`;
  const hasServings = food.servingOptions.length > 0;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.row}>
      <View style={styles.headerRow}>
        <FoodIcon foodId={food.id} foodName={food.name} size={40} />
        <View style={styles.nameCol}>
          <Text style={styles.name}>{food.name}</Text>
          <Text style={styles.base}>{baseText}</Text>
        </View>
        <View
          style={styles.contributionBox}
          accessibilityLabel={`${food.name}贡献`}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.contributionValue}>{contribution}</Text>
          <Text style={styles.contributionUnit}>g</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${food.name}更多操作`}
          style={styles.menuButton}
          onPress={() => setMenuOpen((open) => !open)}
        >
          <Text style={styles.menuText}>···</Text>
        </Pressable>
      </View>
      {menuOpen ? (
        <View style={styles.menuRow}>
          <Pressable
            accessibilityRole="button"
            style={[styles.menuItem]}
            onPress={() => {
              setMenuOpen(false);
              onEdit();
            }}
          >
            <Text style={styles.menuItemText}>编辑营养值</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              onRemove();
            }}
          >
            <Text style={[styles.menuItemText, styles.removeText]}>从当前计算移除</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.controlRow}>
        <View style={styles.modeSwitch}>
          <SegmentedControl
            options={
              hasServings
                ? [
                    {
                      value: 'canonical' as const,
                      label: food.canonicalUnit,
                      accessibilityLabel: `${food.name}切克数`,
                    },
                    {
                      value: 'serving' as const,
                      label: '份',
                      accessibilityLabel: `${food.name}切份量`,
                    },
                  ]
                : [
                    {
                      value: 'canonical' as const,
                      label: food.canonicalUnit,
                      accessibilityLabel: `${food.name}单位`,
                    },
                  ]
            }
            value={selected.inputMode}
            onChange={onInputModeChange}
            accessibilityLabel={`${food.name}输入模式`}
          />
        </View>
        <View style={styles.stepper}>
          <NumberStepper
            value={displayValue}
            step={step}
            accessibilityLabel={`${food.name}数量`}
            onChange={(value) => {
              if (selected.inputMode === 'serving' && serving) {
                onAmountServing(serving.id, value);
              } else {
                onAmountCanonical(value);
              }
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameCol: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  base: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  menuButton: {
    minHeight: 36,
    paddingHorizontal: 8,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  menuRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  menuItem: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: radius.control,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  removeText: {
    color: colors.danger,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
    paddingLeft: 48,
  },
  modeSwitch: {
    width: 104,
  },
  stepper: {
    flex: 1,
  },
  contributionBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  contributionValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  contributionUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 2,
  },
});
