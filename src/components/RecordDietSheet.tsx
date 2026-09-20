import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FoodRow } from './FoodRow';
import { FoodPickerSheet } from './FoodPickerSheet';
import { FoodEditorModal, EditorMode } from './FoodEditorModal';
import { ProgressBar } from './ui/ProgressBar';
import { Calculator } from '../hooks/useProteinCalculator';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { formatProtein, calculateProteinBalance } from '../domain/protein';
import { formatCoefficient, getGoalCoefficient } from '../domain/proteinGoal';
import { FoodDefinition } from '../types';
import { PROTEIN_GOAL_MODE_COPY } from '../data/proteinGoalModes';

interface RecordDietSheetProps {
  visible: boolean;
  onClose: () => void;
  calculator: Calculator;
  onChangeGoal: () => void;
}

/**
 * 记录饮食屏（T142 / 原型屏4）：
 * 顶部目标摘要（更改目标入口）+ 卡片 food rows + 明确数量控件 + 底部已摄入/还需汇总。
 * serving 入口由真实数据决定（canUseServingMode）；不实现原型的收藏/常用/最近 tab 等未定义入口。
 */
export function RecordDietSheet({
  visible,
  onClose,
  calculator,
  onChangeGoal,
}: RecordDietSheetProps) {
  const insets = useSafeAreaInsets();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editorState, setEditorState] = useState<EditorMode | null>(null);

  if (!visible) {
    return null;
  }

  const balance =
    calculator.targetProtein === null
      ? null
      : calculateProteinBalance(calculator.targetProtein, calculator.totalProtein);
  const remaining =
    balance?.type === 'remaining'
      ? `还需 ${formatProtein(balance.amount)} g`
      : balance?.type === 'over'
        ? `超出 ${formatProtein(balance.amount)} g`
        : balance?.type === 'met'
          ? '已达标'
          : '—';
  const progress =
    calculator.targetProtein !== null && calculator.targetProtein > 0
      ? calculator.totalProtein / calculator.targetProtein
      : 0;

  const modeCopy = PROTEIN_GOAL_MODE_COPY[calculator.proteinGoal.mode];
  const levelLabel = calculator.proteinGoal.level === 'low' ? '低' : '高';
  const coefficient = getGoalCoefficient(calculator.proteinGoal.mode, calculator.proteinGoal.level);

  const openEditorForFood = (food: FoodDefinition) => {
    setEditorState(
      food.source === 'preset' ? { kind: 'preset', food } : { kind: 'custom-edit', food },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="返回首页"
            hitSlop={12}
            style={styles.backButton}
            onPress={onClose}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>记录饮食</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 96 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.targetCard}>
            <View style={styles.targetLeft}>
              <Text style={styles.targetLabel}>今日目标</Text>
              <View style={styles.targetNumberRow}>
                <Text style={styles.targetNumber}>
                  {calculator.targetProtein === null
                    ? '—'
                    : formatProtein(calculator.targetProtein)}
                </Text>
                <Text style={styles.targetUnit}>g</Text>
              </View>
              <Text style={styles.targetNote}>
                {calculator.weightKg !== null
                  ? `${modeCopy.name} · ${levelLabel} ${formatCoefficient(coefficient)}×（${calculator.weightKg} kg）`
                  : '输入有效体重后自动计算'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="更改目标"
              style={styles.changeGoalButton}
              onPress={onChangeGoal}
            >
              <Text style={styles.changeGoalText}>更改目标 ›</Text>
            </Pressable>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>今日已摄入</Text>
              <Text style={styles.progressRight}>{remaining}</Text>
            </View>
            <Text style={styles.progressNumbers}>
              <Text style={styles.progressTotal}>{formatProtein(calculator.totalProtein)}</Text>
              {calculator.targetProtein !== null ? (
                <Text style={styles.progressTarget}>
                  {' '}
                  / {formatProtein(calculator.targetProtein)} g
                </Text>
              ) : null}
            </Text>
            <ProgressBar progress={progress} accessibilityLabel="蛋白质摄入进度" />
          </View>

          <Text style={styles.sectionTitle}>添加记录</Text>
          <View style={styles.foodCard}>
            {calculator.selectedFoods.map((selectedFood) => {
              const food = calculator.getFoodById(selectedFood.foodId);
              if (!food) {
                return null;
              }
              return (
                <FoodRow
                  key={selectedFood.foodId}
                  food={food}
                  selected={selectedFood}
                  onAmountCanonical={(amount) =>
                    calculator.setAmountCanonical(selectedFood.foodId, amount)
                  }
                  onAmountServing={(servingId, count) => {
                    const serving = food.servingOptions.find((option) => option.id === servingId);
                    if (serving) {
                      calculator.setAmountServing(selectedFood.foodId, serving, count);
                    }
                  }}
                  onInputModeChange={(mode) => calculator.setInputMode(selectedFood.foodId, mode)}
                  onEdit={() => openEditorForFood(food)}
                  onRemove={() => calculator.removeFood(selectedFood.foodId)}
                />
              );
            })}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="添加食物"
              style={styles.addButton}
              onPress={() => setPickerVisible(true)}
            >
              <Text style={styles.addButtonText}>＋ 添加食物</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* 底部汇总条（原型：今日已摄入 62g｜还需 47g），edge-to-edge 下避开导航栏 insets。 */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.bottomItem}>
            <Text style={styles.bottomLabel}>今日已摄入</Text>
            <Text style={styles.bottomValue}>{formatProtein(calculator.totalProtein)} g</Text>
          </View>
          <View style={styles.bottomDivider} />
          <View style={styles.bottomItem}>
            <Text style={styles.bottomLabel}>{balance?.type === 'over' ? '超出' : '还需'}</Text>
            <Text style={styles.bottomValue}>
              {balance?.type === 'over'
                ? `${formatProtein(balance.amount)} g`
                : balance?.type === 'remaining'
                  ? `${formatProtein(balance.amount)} g`
                  : '0 g'}
            </Text>
          </View>
        </View>
      </View>

      <FoodPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        calculator={calculator}
        onRequestCreateCustom={() => setEditorState({ kind: 'custom-create' })}
        onRequestEditFood={(food) => openEditorForFood(food)}
      />

      <FoodEditorModal
        state={editorState}
        onClose={() => setEditorState(null)}
        onSavePresetOverride={(foodId: string, override) =>
          calculator.savePresetOverride(foodId, override)
        }
        onResetPresetOverride={calculator.resetPresetOverride}
        hasPresetOverride={(foodId) => foodId in calculator.foodOverrides}
        onSaveCustom={calculator.addCustomFood}
        onUpdateCustom={calculator.updateCustomFood}
        onDeleteCustom={calculator.deleteCustomFood}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
  },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.card,
    backgroundColor: colors.targetCard,
    padding: spacing.lg,
  },
  targetLeft: {
    flex: 1,
  },
  targetLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  targetNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  targetNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
  },
  targetUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  targetNote: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  changeGoalButton: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeGoalText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  progressCard: {
    marginTop: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  progressRight: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  progressNumbers: {
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  progressTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  progressTarget: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  foodCard: {
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 50,
    borderRadius: radius.control + 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  bottomItem: {
    flex: 1,
    alignItems: 'center',
  },
  bottomLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bottomDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
});
