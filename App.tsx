import { StatusBar } from 'expo-status-bar';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useProteinCalculator } from './src/hooks/useProteinCalculator';
import { WeightCard } from './src/components/WeightCard';
import { CoefficientSelector } from './src/components/CoefficientSelector';
import { TargetCard } from './src/components/TargetCard';
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
import { radius } from './src/theme/radius';
import { spacing } from './src/theme/spacing';
import { typography } from './src/theme/typography';
import { FoodDefinition, PresetFoodOverride } from './src/types';

// US6/FR-022：native splash 作为启动过渡，hydrate 完成前保持 splash（T062/T063）。
void preventAutoHideAsync().catch(() => undefined);

function CalculatorHome() {
  const calculator = useProteinCalculator();
  const [pickerVisible, setPickerVisible] = useState(false);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require('./assets/icon.png')} style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={typography.headerTitle}>蛋白质计算器</Text>
            <Text style={typography.tagline}>吃对蛋白质，更好的自己</Text>
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

        <View style={styles.section}>
          <Card>
            <Text style={typography.cardTitle}>蛋白质目标 (g/kg)</Text>
            <View style={styles.coefficients}>
              <CoefficientSelector
                coefficient={calculator.coefficient}
                onChange={calculator.setCoefficient}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <TargetCard
            weightKg={calculator.weightKg}
            coefficient={calculator.coefficient}
            targetProtein={calculator.targetProtein}
          />
        </View>

        <View style={styles.foodHeader}>
          <Text style={typography.cardTitle}>我的食物</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="清空数量"
            onPress={calculator.clearAmounts}
          >
            <Text style={styles.clearText}>清空</Text>
          </Pressable>
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

        <View style={styles.section}>
          <Card>
            <ProteinSummary
              total={calculator.totalProtein}
              target={calculator.targetProtein}
              balance={balance}
            />
          </Card>
        </View>

        {/* V1.4 Top30 入口卡：主计算汇总之后、品牌装饰之前，不重排首页（Constitution Principle VI）。 */}
        <View style={styles.section}>
          <ProteinRankingEntryCard onPress={() => setRankingVisible(true)} />
        </View>
      </ScrollView>

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
    minHeight: 44,
    minWidth: 44,
    borderRadius: 22,
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
  coefficients: {
    marginTop: spacing.md,
  },
  foodHeader: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    minHeight: 44,
    lineHeight: 44,
  },
  foodList: {
    marginTop: spacing.xs,
  },
  addButton: {
    marginTop: spacing.md,
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
});
