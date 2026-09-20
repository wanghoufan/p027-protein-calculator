import { MAX_RECENT_FOODS, PresetFoodOverride, FoodDefinition, SelectedFood } from '../types';

/**
 * preset + override 合并（FR-013）：
 * 只允许覆盖 proteinPerBase / baseAmount / servingOptions；
 * id / source / name / category / canonical type / unit 不可被 override 修改。
 */
export function resolvePresetFood(
  preset: FoodDefinition,
  override?: PresetFoodOverride,
): FoodDefinition {
  if (!override) {
    return preset;
  }
  return {
    ...preset,
    proteinPerBase: override.proteinPerBase ?? preset.proteinPerBase,
    baseAmount: override.baseAmount ?? preset.baseAmount,
    servingOptions: override.servingOptions ?? preset.servingOptions,
  };
}

/**
 * 最近常用食物（FR-012）：去重、置顶、最多 MAX_RECENT_FOODS（4）。
 */
export function updateRecentFoodIds(ids: readonly string[], foodId: string): string[] {
  const next = [foodId, ...ids.filter((id) => id !== foodId)];
  return next.slice(0, MAX_RECENT_FOODS);
}

/**
 * 删除 custom food 时同步清理 selectedFoods / recentFoodIds 引用（US5.8）。
 * 泛型：兼容任意含这两字段的持久化状态版本（V1/V2）。
 */
export function removeCustomFoodReferences<
  T extends { selectedFoods: SelectedFood[]; recentFoodIds: string[] },
>(state: T, foodId: string): T {
  return {
    ...state,
    selectedFoods: state.selectedFoods.filter((selected) => selected.foodId !== foodId),
    recentFoodIds: state.recentFoodIds.filter((id) => id !== foodId),
  };
}

/** 当前计算是否已包含某食物（US3.11/12）。 */
export function isSelected(selectedFoods: readonly { foodId: string }[], foodId: string): boolean {
  return selectedFoods.some((selected) => selected.foodId === foodId);
}

/** 从当前计算移除（不影响 preset 库 / overrides / custom，US2.12）。 */
export function removeSelectedFood(
  selectedFoods: readonly SelectedFood[],
  foodId: string,
): SelectedFood[] {
  return selectedFoods.filter((selected) => selected.foodId !== foodId);
}
