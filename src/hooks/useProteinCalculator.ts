import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PRESET_FOODS, PRESET_FOOD_MAP } from '../data/presetFoods';
import {
  removeCustomFoodReferences,
  removeSelectedFood,
  resolvePresetFood,
  isSelected,
  updateRecentFoodIds,
} from '../domain/food';
import { calculateTargetProtein, calculateTotalProtein } from '../domain/protein';
import { validateWeightKg } from '../domain/proteinGoal';
import { canUseServingMode, validateServingInput } from '../domain/serving';
import { validateCustomFood, validatePresetOverride } from '../domain/validate';
import { loadState, saveState } from '../storage/storage';
import {
  FoodDefinition,
  PersistedState,
  PresetFoodOverride,
  ProteinGoalLevel,
  ProteinGoalMode,
  SelectedFood,
  ServingOption,
} from '../types';

const SAVE_DEBOUNCE_MS = 250;

export interface CustomFoodDraft {
  name: string;
  canonicalType: FoodDefinition['canonicalType'];
  canonicalUnit: FoodDefinition['canonicalUnit'];
  proteinPerBase: number;
  baseAmount: number;
  servingOptions: ServingOption[];
}

export interface ServingOperationResult {
  ok: boolean;
  errors: string[];
}

/**
 * serving 模式失效回退（T136 / FR-046）：
 * servingId 不存在或食物已无 serving 时，回 canonical、清 servingId、数量归 0；
 * 不做 g↔ml 换算，不把份数当克/毫升。
 */
function sanitizeSelectedServing(selected: SelectedFood, food?: FoodDefinition): SelectedFood {
  if (selected.inputMode !== 'serving') {
    return selected;
  }
  const servings = food?.servingOptions ?? [];
  const valid =
    servings.length > 0 &&
    selected.servingId !== undefined &&
    servings.some((option) => option.id === selected.servingId);
  if (valid) {
    return selected;
  }
  return { ...selected, inputMode: 'canonical', servingId: undefined, amountInCanonicalUnit: 0 };
}

export interface Calculator {
  ready: boolean;
  weightKg: number | null;
  setWeightRaw: (value: number | null) => void;
  proteinGoal: { mode: ProteinGoalMode; level: ProteinGoalLevel };
  setProteinGoal: (mode: ProteinGoalMode, level: ProteinGoalLevel) => void;
  goalModelNoticePending: boolean;
  acknowledgeGoalModelNotice: () => void;
  targetProtein: number | null;
  effectiveFoods: readonly FoodDefinition[];
  getFoodById: (foodId: string) => FoodDefinition | undefined;
  selectedFoods: readonly SelectedFood[];
  foodOverrides: Readonly<Record<string, PresetFoodOverride>>;
  customFoods: readonly FoodDefinition[];
  recentFoodIds: readonly string[];
  totalProtein: number;
  addFood: (foodId: string) => void;
  removeFood: (foodId: string) => void;
  clearAmounts: () => void;
  setAmountCanonical: (foodId: string, amount: number) => void;
  setAmountServing: (foodId: string, serving: ServingOption, count: number) => void;
  setInputMode: (foodId: string, mode: SelectedFood['inputMode']) => void;
  isFoodSelected: (foodId: string) => boolean;
  canUseServingMode: (food: FoodDefinition) => boolean;
  addUserServing: (foodId: string, label: string, amount: number) => ServingOperationResult;
  updateUserServing: (
    foodId: string,
    servingId: string,
    label: string,
    amount: number,
  ) => ServingOperationResult;
  deleteUserServing: (foodId: string, servingId: string) => ServingOperationResult;
  savePresetOverride: (
    foodId: string,
    override: PresetFoodOverride,
  ) => { ok: boolean; errors: string[] };
  resetPresetOverride: (foodId: string) => void;
  addCustomFood: (draft: CustomFoodDraft) => { ok: boolean; errors: string[] };
  updateCustomFood: (foodId: string, draft: CustomFoodDraft) => { ok: boolean; errors: string[] };
  deleteCustomFood: (foodId: string) => void;
}

export function useProteinCalculator(): Calculator {
  const [state, setState] = useState<PersistedState | null>(null);
  const [ready, setReady] = useState(false);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const readyRef = useRef(false);

  // US6：bootstrap hydrate，完成前置 ready=false，由 App 保持 splash（T062）。
  useEffect(() => {
    let cancelled = false;
    loadState().then((loaded) => {
      if (cancelled) return;
      // 加载后立即清洗失效 serving 引用（迁移数据可能指向已删除 serving）。
      const foodMap = new Map<string, FoodDefinition>();
      for (const preset of PRESET_FOODS) {
        foodMap.set(preset.id, resolvePresetFood(preset, loaded.foodOverrides[preset.id]));
      }
      for (const custom of loaded.customFoods) {
        foodMap.set(custom.id, custom);
      }
      const sanitized: PersistedState = {
        ...loaded,
        selectedFoods: loaded.selectedFoods.map((selected) =>
          sanitizeSelectedServing(selected, foodMap.get(selected.foodId)),
        ),
      };
      setState(sanitized);
      setWeightKg(sanitized.weightKg);
      readyRef.current = true;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // US6：200~300ms debounce save，避免每次 `+` 高频写盘（T061）。
  // 卸载后不再落盘（守卫定时器回调，避免测试/快速切换时把旧状态写穿到下一轮）。
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !state) return;
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        void saveState(state);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state, ready]);

  /** preset override 合并后的有效食物（preset + custom）。 */
  const effectiveFoods = useMemo<readonly FoodDefinition[]>(() => {
    const overrides = state?.foodOverrides ?? {};
    return [
      ...PRESET_FOODS.map((preset) => resolvePresetFood(preset, overrides[preset.id])),
      ...(state?.customFoods ?? []),
    ];
  }, [state]);

  const foodMap = useMemo(
    () => new Map(effectiveFoods.map((food) => [food.id, food])),
    [effectiveFoods],
  );

  const getFoodById = useCallback((foodId: string) => foodMap.get(foodId), [foodMap]);

  const mutate = useCallback((updater: (prev: PersistedState) => PersistedState) => {
    setState((prev) => (prev ? updater(prev) : prev));
  }, []);

  const setWeightRaw = useCallback(
    (value: number | null) => {
      if (value === null) {
        setWeightKg(null);
        return;
      }
      // 体重校验（FR-055）：finite 且 >0 才写权威状态，无效值只留在输入框。
      const validation = validateWeightKg(value);
      setWeightKg(value);
      if (validation.valid) {
        mutate((prev) => ({ ...prev, weightKg: validation.value }));
      }
    },
    [mutate],
  );

  const setProteinGoal = useCallback(
    (mode: ProteinGoalMode, level: ProteinGoalLevel) => {
      mutate((prev) => ({
        ...prev,
        proteinGoal: { mode, level },
        // 选择目标即视为对迁移变化的确认（SPEC §10：进入目标选择确认）。
        migrationNotices: { ...prev.migrationNotices, goalModelV151Acknowledged: true },
      }));
    },
    [mutate],
  );

  const acknowledgeGoalModelNotice = useCallback(() => {
    mutate((prev) => ({
      ...prev,
      migrationNotices: { ...prev.migrationNotices, goalModelV151Acknowledged: true },
    }));
  }, [mutate]);

  const addFood = useCallback(
    (foodId: string) => {
      mutate((prev) => {
        if (!foodMap.has(foodId) || isSelected(prev.selectedFoods, foodId)) {
          return prev; // 同一食物只保留一行，重复添加不新增（US3.11）。
        }
        return {
          ...prev,
          selectedFoods: [
            ...prev.selectedFoods,
            { foodId, amountInCanonicalUnit: 0, inputMode: 'canonical' as const },
          ],
          recentFoodIds: updateRecentFoodIds(prev.recentFoodIds, foodId),
        };
      });
    },
    [foodMap, mutate],
  );

  const removeFood = useCallback(
    (foodId: string) => {
      mutate((prev) => ({
        ...prev,
        selectedFoods: removeSelectedFood(prev.selectedFoods, foodId),
      }));
    },
    [mutate],
  );

  const clearAmounts = useCallback(() => {
    // “清空”只把 amount 归 0，不删除当前食物 / 覆盖值 / 自定义食物（US2.11）。
    mutate((prev) => ({
      ...prev,
      selectedFoods: prev.selectedFoods.map((selected) => ({
        ...selected,
        amountInCanonicalUnit: 0,
      })),
    }));
  }, [mutate]);

  const updateSelected = useCallback(
    (foodId: string, updater: (selected: SelectedFood) => SelectedFood) => {
      mutate((prev) => ({
        ...prev,
        selectedFoods: prev.selectedFoods.map((selected) =>
          selected.foodId === foodId ? updater(selected) : selected,
        ),
      }));
    },
    [mutate],
  );

  const setAmountCanonical = useCallback(
    (foodId: string, amount: number) => {
      updateSelected(foodId, (selected) => ({
        ...selected,
        amountInCanonicalUnit: Number.isFinite(amount) && amount > 0 ? amount : 0,
        inputMode: 'canonical',
        servingId: undefined,
      }));
    },
    [updateSelected],
  );

  const setAmountServing = useCallback(
    (foodId: string, serving: ServingOption, count: number) => {
      updateSelected(foodId, (selected) => ({
        ...selected,
        amountInCanonicalUnit:
          Number.isFinite(count) && count > 0 ? count * serving.amountInCanonicalUnit : 0,
        inputMode: 'serving',
        servingId: serving.id,
      }));
    },
    [updateSelected],
  );

  const setInputMode = useCallback(
    (foodId: string, mode: SelectedFood['inputMode']) => {
      // 仅改变展示/输入模式，不改 amountInCanonicalUnit（FR-008）；
      // 无有效 serving 时禁止进入 serving mode（T134）。
      const food = foodMap.get(foodId);
      if (mode === 'serving' && !(food && canUseServingMode(food))) {
        return;
      }
      updateSelected(foodId, (selected) => ({
        ...selected,
        inputMode: mode,
        servingId:
          mode === 'serving' ? (selected.servingId ?? food?.servingOptions[0]?.id) : undefined,
      }));
    },
    [foodMap, updateSelected],
  );

  const isFoodSelected = useCallback(
    (foodId: string) => (state?.selectedFoods ?? []).some((s) => s.foodId === foodId),
    [state],
  );

  /** serving 模式可用性（T134）：由真实数据决定入口。 */
  const canUseServingModeFor = useCallback((food: FoodDefinition) => canUseServingMode(food), []);

  /**
   * USER_DEFINED serving CRUD（T135 / FR-045）。
   * preset 食物的 serving 列表存于 foodOverrides[foodId].servingOptions（override 机制），
   * custom 食物存于定义本身；新增一律 origin=USER_DEFINED。
   */
  const applyServingList = useCallback(
    (foodId: string, nextServings: ServingOption[]) => {
      const food = foodMap.get(foodId);
      if (!food) {
        return { ok: false, errors: ['食物不存在'] };
      }
      let result: ServingOperationResult = { ok: true, errors: [] };
      mutate((prev) => {
        if (food.source === 'preset') {
          const override: PresetFoodOverride = {
            ...(prev.foodOverrides[foodId] ?? {}),
            servingOptions: nextServings,
          };
          const validation = validatePresetOverride({
            proteinPerBase: override.proteinPerBase ?? food.proteinPerBase,
            baseAmount: override.baseAmount ?? food.baseAmount,
            servingOptions: override.servingOptions,
          });
          if (!validation.valid) {
            result = { ok: false, errors: validation.errors };
            return prev;
          }
          return {
            ...prev,
            foodOverrides: { ...prev.foodOverrides, [foodId]: override },
            // 失效 servingId 引用立即回退（FR-046）。
            selectedFoods: prev.selectedFoods.map((selected) =>
              sanitizeSelectedServing(selected, { ...food, servingOptions: nextServings }),
            ),
          };
        }
        const validation = validateServingInput(
          nextServings[nextServings.length - 1]?.label ?? '',
          nextServings[nextServings.length - 1]?.amountInCanonicalUnit ?? 0,
        );
        if (!validation.valid) {
          result = { ok: false, errors: validation.errors };
          return prev;
        }
        return {
          ...prev,
          customFoods: prev.customFoods.map((custom) =>
            custom.id === foodId ? { ...custom, servingOptions: nextServings } : custom,
          ),
          selectedFoods: prev.selectedFoods.map((selected) =>
            sanitizeSelectedServing(selected, { ...food, servingOptions: nextServings }),
          ),
        };
      });
      return result;
    },
    [foodMap, mutate],
  );

  const addUserServing = useCallback(
    (foodId: string, label: string, amount: number) => {
      const validation = validateServingInput(label, amount);
      if (!validation.valid) {
        return { ok: false, errors: validation.errors };
      }
      const food = foodMap.get(foodId);
      if (!food) {
        return { ok: false, errors: ['食物不存在'] };
      }
      const serving: ServingOption = {
        id: `user-${Date.now()}`,
        label: label.trim(),
        amountInCanonicalUnit: amount,
        origin: 'USER_DEFINED',
      };
      return applyServingList(foodId, [...food.servingOptions, serving]);
    },
    [applyServingList, foodMap],
  );

  const updateUserServing = useCallback(
    (foodId: string, servingId: string, label: string, amount: number) => {
      const validation = validateServingInput(label, amount);
      if (!validation.valid) {
        return { ok: false, errors: validation.errors };
      }
      const food = foodMap.get(foodId);
      if (!food) {
        return { ok: false, errors: ['食物不存在'] };
      }
      const target = food.servingOptions.find((option) => option.id === servingId);
      if (!target) {
        return { ok: false, errors: ['份量不存在'] };
      }
      // origin 不变：系统默认被编辑仍为 SYSTEM_DEFAULT（override 语义，Principle VI）。
      const nextServings = food.servingOptions.map((option) =>
        option.id === servingId
          ? { ...option, label: label.trim(), amountInCanonicalUnit: amount }
          : option,
      );
      return applyServingList(foodId, nextServings);
    },
    [applyServingList, foodMap],
  );

  const deleteUserServing = useCallback(
    (foodId: string, servingId: string) => {
      const food = foodMap.get(foodId);
      if (!food) {
        return { ok: false, errors: ['食物不存在'] };
      }
      const target = food.servingOptions.find((option) => option.id === servingId);
      if (!target) {
        return { ok: false, errors: ['份量不存在'] };
      }
      if (target.origin !== 'USER_DEFINED') {
        // 系统默认不允许删除；“恢复默认”走既有 override 重置路径。
        return { ok: false, errors: ['系统默认份量不可删除'] };
      }
      const nextServings = food.servingOptions.filter((option) => option.id !== servingId);
      return applyServingList(foodId, nextServings);
    },
    [applyServingList, foodMap],
  );

  const savePresetOverride = useCallback(
    (foodId: string, override: PresetFoodOverride) => {
      const current = foodMap.get(foodId);
      const validation = validatePresetOverride({
        proteinPerBase: override.proteinPerBase ?? 1,
        baseAmount: override.baseAmount ?? 1,
        servingOptions: override.servingOptions,
      });
      if (!validation.valid) {
        return { ok: false, errors: validation.errors };
      }
      mutate((prev) => ({
        ...prev,
        foodOverrides: { ...prev.foodOverrides, [foodId]: override },
        selectedFoods: current
          ? prev.selectedFoods.map((selected) =>
              sanitizeSelectedServing(selected, { ...current, ...override }),
            )
          : prev.selectedFoods,
      }));
      return { ok: true, errors: [] };
    },
    [foodMap, mutate],
  );

  const resetPresetOverride = useCallback(
    (foodId: string) => {
      mutate((prev) => {
        const nextOverrides = { ...prev.foodOverrides };
        delete nextOverrides[foodId];
        const base = PRESET_FOOD_MAP.get(foodId);
        return {
          ...prev,
          foodOverrides: nextOverrides,
          selectedFoods: prev.selectedFoods.map((selected) =>
            sanitizeSelectedServing(selected, base ?? foodMap.get(selected.foodId)),
          ),
        };
      });
    },
    [foodMap, mutate],
  );

  const addCustomFood = useCallback(
    (draft: CustomFoodDraft) => {
      const validation = validateCustomFood(draft);
      if (!validation.valid) {
        return { ok: false, errors: validation.errors };
      }
      const food: FoodDefinition = {
        id: `custom-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        source: 'custom',
        name: draft.name.trim(),
        category: 'custom',
        canonicalType: draft.canonicalType,
        canonicalUnit: draft.canonicalUnit,
        proteinPerBase: draft.proteinPerBase,
        baseAmount: draft.baseAmount,
        servingOptions: draft.servingOptions,
      };
      mutate((prev) => ({ ...prev, customFoods: [...prev.customFoods, food] }));
      return { ok: true, errors: [] };
    },
    [mutate],
  );

  const updateCustomFood = useCallback(
    (foodId: string, draft: CustomFoodDraft) => {
      const validation = validateCustomFood(draft);
      if (!validation.valid) {
        return { ok: false, errors: validation.errors };
      }
      mutate((prev) => ({
        ...prev,
        customFoods: prev.customFoods.map((food) =>
          food.id === foodId
            ? {
                ...food,
                name: draft.name.trim(),
                canonicalType: draft.canonicalType,
                canonicalUnit: draft.canonicalUnit,
                proteinPerBase: draft.proteinPerBase,
                baseAmount: draft.baseAmount,
                servingOptions: draft.servingOptions,
              }
            : food,
        ),
        selectedFoods: prev.selectedFoods.map((selected) =>
          sanitizeSelectedServing(
            selected,
            selected.foodId === foodId
              ? {
                  ...(foodMap.get(foodId) as FoodDefinition),
                  name: draft.name.trim(),
                  canonicalType: draft.canonicalType,
                  canonicalUnit: draft.canonicalUnit,
                  proteinPerBase: draft.proteinPerBase,
                  baseAmount: draft.baseAmount,
                  servingOptions: draft.servingOptions,
                }
              : foodMap.get(selected.foodId),
          ),
        ),
      }));
      return { ok: true, errors: [] };
    },
    [foodMap, mutate],
  );

  const deleteCustomFood = useCallback(
    (foodId: string) => {
      mutate((prev) => {
        const cleared = removeCustomFoodReferences(prev, foodId);
        return {
          ...cleared,
          customFoods: cleared.customFoods.filter((food) => food.id !== foodId),
        };
      });
    },
    [mutate],
  );

  const selectedFoods = useMemo(() => state?.selectedFoods ?? [], [state]);
  const targetProtein = useMemo(() => {
    if (weightKg === null || weightKg <= 0 || !state) {
      return null;
    }
    return calculateTargetProtein(weightKg, state.proteinGoal.mode, state.proteinGoal.level);
  }, [weightKg, state]);
  const totalProtein = useMemo(
    () => calculateTotalProtein(effectiveFoods, selectedFoods),
    [effectiveFoods, selectedFoods],
  );

  return {
    ready,
    weightKg,
    setWeightRaw,
    proteinGoal: state?.proteinGoal ?? { mode: 'daily_maintenance', level: 'high' },
    setProteinGoal,
    goalModelNoticePending: !(state?.migrationNotices.goalModelV151Acknowledged ?? true),
    acknowledgeGoalModelNotice,
    targetProtein,
    effectiveFoods,
    getFoodById,
    selectedFoods,
    foodOverrides: state?.foodOverrides ?? {},
    customFoods: state?.customFoods ?? [],
    recentFoodIds: state?.recentFoodIds ?? [],
    totalProtein,
    addFood,
    removeFood,
    clearAmounts,
    setAmountCanonical,
    setAmountServing,
    setInputMode,
    isFoodSelected,
    canUseServingMode: canUseServingModeFor,
    addUserServing,
    updateUserServing,
    deleteUserServing,
    savePresetOverride,
    resetPresetOverride,
    addCustomFood,
    updateCustomFood,
    deleteCustomFood,
  };
}
