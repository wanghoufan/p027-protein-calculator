import {
  FoodDefinition,
  ProteinBalance,
  ProteinGoalLevel,
  ProteinGoalMode,
  SelectedFood,
} from '../types';
import { getGoalCoefficient } from './proteinGoal';

/**
 * 每日目标蛋白质：weightKg × getGoalCoefficient(mode, level)（V1.5.1 SPEC §3）。
 * 内部计算不提前 round。
 */
export function calculateTargetProtein(
  weightKg: number,
  mode: ProteinGoalMode,
  level: ProteinGoalLevel,
): number {
  return weightKg * getGoalCoefficient(mode, level);
}

/**
 * 单食物蛋白质：amountInCanonicalUnit ÷ baseAmount × proteinPerBase。
 * amountInCanonicalUnit 是唯一计算来源（Constitution Principle IV）。
 */
export function calculateFoodProtein(food: FoodDefinition, amountInCanonicalUnit: number): number {
  if (food.baseAmount <= 0) {
    return 0;
  }
  return (amountInCanonicalUnit / food.baseAmount) * food.proteinPerBase;
}

/** 总摄入：Σ foodProtein（FR-016）。 */
export function calculateTotalProtein(
  effectiveFoods: readonly FoodDefinition[],
  selectedFoods: readonly SelectedFood[],
): number {
  const foodMap = new Map(effectiveFoods.map((food) => [food.id, food]));
  return selectedFoods.reduce((total, selectedFood) => {
    const food = foodMap.get(selectedFood.foodId);
    if (!food) {
      return total;
    }
    return total + calculateFoodProtein(food, selectedFood.amountInCanonicalUnit);
  }, 0);
}

/** 差值：还差 / 超出 / 已达标（FR-017）。 */
export function calculateProteinBalance(target: number, total: number): ProteinBalance {
  if (total < target) {
    return { type: 'remaining', amount: target - total };
  }
  if (total > target) {
    return { type: 'over', amount: total - target };
  }
  return { type: 'met', amount: 0 };
}

/**
 * UI 展示：四舍五入到 1 位小数，整数省略 `.0`（Constitution Principle III）。
 */
export function formatProtein(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const rounded = Math.round(value * 10) / 10;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(1);
}
