import { StatusBar } from 'expo-status-bar';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useProteinCalculator } from './src/hooks/useProteinCalculator';
import { WeightCard } from './src/components/WeightCard';
import { ProteinGoalSummaryCard } from './src/components/ProteinGoalSummaryCard';
import {
  ProteinGoalModeSelector,
  ProteinGoalLevelSelector,
} from './src/components/ProteinGoalSelector';
import { ProteinGoalPickerSheet } from './src/components/ProteinGoalPickerSheet';
import { ProteinGoalDetailView } from './src/components/ProteinGoalDetailView';
import { MigrationNoticeCard } from './src/components/MigrationNoticeCard';
import { RecordDietSheet } from './src/components/RecordDietSheet';
import { FoodRow } from './src/components/FoodRow';
import { ProteinSummary } from './src/components/ProteinSummary';
import { FoodPickerSheet } from './src/components/FoodPickerSheet';
import { FoodEditorModal, EditorMode } from './src/components/FoodEditorModal';
import { AboutSheet } from './src/components/AboutSheet';
import { ProteinRankingEntryCard } from './src/components/ProteinRankingEntryCard';
import { ProteinRankingModal } from './src/components/ProteinRankingModal';
import { Card } from './src/components/ui/Card';
import { calculateProteinBalance } from './src/domain/protein';
import { colors } from './src/theme/colors';
import { spacing } from './src/theme/spacing';
import { typography } from './src/theme/typography';
import { FoodDefinition, PresetFoodOverride, ProteinGoalMode } from './src/types';

// US6/FR-022：native splash 作为启动过渡，hydrate 完成前保持 splash（T062/T063）。
void preventAutoHideAsync().catch(() => undefined);

function CalculatorHome() {
  const calculator = useProteinCalculator();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [recordVisible, setRecordVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [rankingVisible, setRankingVisible] = useState(false);
  const [editorState, setEditorState] = useState<EditorMode | null>(null);

  useEffect(() => {
    if (calculator.ready) {
      void hideAsync().catch(() => undefined);
    }
  }, [calculator.ready]);

  if (!calculator.ready) {
    // hydrate 完成前不渲染默认业务数据（US6.5），native splash 仍在前台。
    return null;
  }

  const balance =
    calculator.targetProtein === null
      ? null
      : calculateProteinBalance(calculator.targetProtein, calculator.totalProtein);

  const hasPresetOverride = (foodId: string) => foodId in calculator.foodOverrides;

  const openEditorForFood = (food: FoodDefinition) => {
    setEditorState(
      food.source === 'preset' ? { kind: 'preset', food } : { kind: 'custom-edit', food },
    );
  };

  const resetAllOverrides = () => {
    Object.keys(calculator.foodOverrides).forEach((foodId) => {
      calculator.resetPresetOverride(foodId);
    });
  };

  const handleSelectMode = (mode: ProteinGoalMode) => {
    calculator.setProteinGoal(mode, calculator.proteinGoal.level);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require('./assets/icon.png')} style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={typography.headerTitle}>蛋白质计算器</Text>
            <Text style={typography.tagline}>科学计算 · 合理摄入 · 更健康的你</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="设置"
            style={styles.gearButton}
            onPress={() => setSettingsVisible(true)}
          >
            <Text style={styles.gearIcon}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <WeightCard weightKg={calculator.weightKg} onWeightChange={calculator.setWeightRaw} />
        </View>

        {/* 蛋白质目标模块（T138 / 原型首页）：模式一级、系数二级；「如何选择？」进目标选择。 */}
        <View style={styles.section}>
          <Card>
            <View style={styles.goalHeader}>
              <Text style={typography.cardTitle}>蛋白质目标 ⓘ</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="如何选择蛋白质目标"
                onPress={() => setGoalPickerVisible(true)}
              >
                <Text style={styles.howToChoose}>如何选择？ ›</Text>
              </Pressable>
            </View>
            <View style={styles.modeSelector}>
              <ProteinGoalModeSelector
                mode={calculator.proteinGoal.mode}
                onSelectMode={handleSelectMode}
              />
            </View>
            <View style={styles.modeSelector}>
              <ProteinGoalLevelSelector
                mode={calculator.proteinGoal.mode}
                level={calculator.proteinGoal.level}
                onSelectLevel={(level) =>
                  calculator.setProteinGoal(calculator.proteinGoal.mode, level)
                }
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="查看模式说明"
              onPress={() => setDetailVisible(true)}
            >
              <Text style={styles.detailLink}>查看模式说明与数据来源</Text>
            </Pressable>
          </Card>
        </View>

        <View style={styles.section}>
          <ProteinGoalSummaryCard
            weightKg={calculator.weightKg}
            proteinGoal={calculator.proteinGoal}
            targetProtein={calculator.targetProtein}
          />
        </View>

        {/* 迁移提示（T143）：legacy 1.5→1.6，持续到用户确认或重新选择目标。 */}
        <View style={styles.section}>
          <MigrationNoticeCard
            visible={calculator.goalModelNoticePending}
            onAcknowledge={calculator.acknowledgeGoalModelNotice}
            onOpenGoalPicker={() => setGoalPickerVisible(true)}
          />
        </View>

        <View style={styles.section}>
          <Card>
            <ProteinSummary
              total={calculator.totalProtein}
              target={calculator.targetProtein}
              balance={balance}
            />
          </Card>
        </View>

        <View style={styles.foodHeader}>
          <Text style={typography.cardTitle}>今日记录</Text>
          <View style={styles.foodHeaderActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="清空数量"
              onPress={calculator.clearAmounts}
            >
              <Text style={styles.clearText}>清空</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="打开记录饮食"
              onPress={() => setRecordVisible(true)}
            >
              <Text style={styles.clearText}>记录饮食 ›</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.section}>
          <Card>
            <View style={styles.foodList}>
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
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="添加食物"
              style={styles.addButton}
              onPress={() => setPickerVisible(true)}
            >
              <Text style={styles.addButtonText}>＋ 添加食物</Text>
            </Pressable>
          </Card>
        </View>

        {/* V1.4 Top30 入口卡：主计算汇总之后，不重排首页（Constitution Principle VI）。 */}
        <View style={styles.section}>
          <ProteinRankingEntryCard onPress={() => setRankingVisible(true)} />
        </View>
      </ScrollView>

      <ProteinGoalPickerSheet
        visible={goalPickerVisible}
        onClose={() => setGoalPickerVisible(false)}
        selection={calculator.proteinGoal}
        onSelect={(mode, level) => {
          calculator.setProteinGoal(mode, level);
        }}
      />

      <ProteinGoalDetailView
        visible={detailVisible}
        mode={calculator.proteinGoal.mode}
        onClose={() => setDetailVisible(false)}
      />

      <RecordDietSheet
        visible={recordVisible}
        onClose={() => setRecordVisible(false)}
        calculator={calculator}
        onChangeGoal={() => setGoalPickerVisible(true)}
      />

      <FoodPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        calculator={calculator}
        onRequestCreateCustom={() => setEditorState({ kind: 'custom-create' })}
        onRequestEditFood={openEditorForFood}
      />

      <ProteinRankingModal
        visible={rankingVisible}
        onClose={() => setRankingVisible(false)}
        calculator={calculator}
      />

      <AboutSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onClearAmounts={calculator.clearAmounts}
        onResetOverrides={resetAllOverrides}
        overrideCount={Object.keys(calculator.foodOverrides).length}
      />

      <FoodEditorModal
        state={editorState}
        onClose={() => setEditorState(null)}
        onSavePresetOverride={(foodId: string, override: PresetFoodOverride) =>
          calculator.savePresetOverride(foodId, override)
        }
        onResetPresetOverride={calculator.resetPresetOverride}
        hasPresetOverride={hasPresetOverride}
        onSaveCustom={calculator.addCustomFood}
        onUpdateCustom={calculator.updateCustomFood}
        onDeleteCustom={calculator.deleteCustomFood}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <CalculatorHome />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  gearButton: {
    minHeight: 48,
    minWidth: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  howToChoose: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    minHeight: 48,
    lineHeight: 48,
  },
  modeSelector: {
    marginTop: spacing.sm,
  },
  detailLink: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    minHeight: 32,
  },
  foodHeader: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodHeaderActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    minHeight: 48,
    lineHeight: 48,
  },
  foodList: {
    marginTop: spacing.xs,
  },
  addButton: {
    marginTop: spacing.md,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
});
