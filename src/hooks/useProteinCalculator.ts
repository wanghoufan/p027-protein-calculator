import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PRESET_FOODS } from '../data/presetFoods';
import {
  removeCustomFoodReferences,
  removeSelectedFood,
  resolvePresetFood,
  isSelected,
  updateRecentFoodIds,
} from '../domain/food';
import { calculateTargetProtein, calculateTotalProtein } from '../domain/protein';
import { validateCustomFood, validatePresetOverride } from '../domain/validate';
import { loadState, saveState } from '../storage/storage';
import {
  Coefficient,
  FoodDefinition,
  PersistedStateV1,
  PresetFoodOverride,
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

export interface Calculator {
  ready: boolean;
  weightKg: number | null;
  setWeightRaw: (value: number | null) => void;
  coefficient: Coefficient;
  setCoefficient: (value: Coefficient) => void;
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
  const [state, setState] = useState<PersistedStateV1 | null>(null);
  const [ready, setReady] = useState(false);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const readyRef = useRef(false);

  // US6：bootstrap hydrate，完成前置 ready=false，由 App 保持 splash（T062）。
  useEffect(() => {
    let cancelled = false;
    loadState().then((loaded) => {
      if (cancelled) return;
      setState(loaded);
      setWeightKg(loaded.weightKg);
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

  const mutate = useCallback((updater: (prev: PersistedStateV1) => PersistedStateV1) => {
    setState((prev) => (prev ? updater(prev) : prev));
  }, []);

  const setWeightRaw = useCallback(
    (value: number | null) => {
      if (value === null) {
        setWeightKg(null);
        return;
      }
      setWeightKg(value);
      if (value > 0) {
        mutate((prev) => ({ ...prev, weightKg: value }));
      }
    },
    [mutate],
  );

  const setCoefficient = useCallback(
    (value: Coefficient) => {
      mutate((prev) => ({ ...prev, coefficient: value }));
    },
    [mutate],
  );

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
      // 仅改变展示/输入模式，不改 amountInCanonicalUnit（FR-008）。
      updateSelected(foodId, (selected) => ({
        ...selected,
        inputMode: mode,
        servingId:
          mode === 'serving'
            ? (selected.servingId ?? foodMap.get(foodId)?.servingOptions[0]?.id)
            : undefined,
      }));
    },
    [foodMap, updateSelected],
  );

  const isFoodSelected = useCallback(
    (foodId: string) => (state?.selectedFoods ?? []).some((s) => s.foodId === foodId),
    [state],
  );

  const savePresetOverride = useCallback(
    (foodId: string, override: PresetFoodOverride) => {
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
      }));
      return { ok: true, errors: [] };
    },
    [mutate],
  );

  const resetPresetOverride = useCallback(
    (foodId: string) => {
      mutate((prev) => {
        const nextOverrides = { ...prev.foodOverrides };
        delete nextOverrides[foodId];
        return { ...prev, foodOverrides: nextOverrides };
      });
    },
    [mutate],
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
      }));
      return { ok: true, errors: [] };
    },
    [mutate],
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
  const targetProtein = useMemo(
    () =>
      weightKg !== null && weightKg > 0
        ? calculateTargetProtein(weightKg, state?.coefficient ?? 1.5)
        : null,
    [weightKg, state?.coefficient],
  );
  const totalProtein = useMemo(
    () => calculateTotalProtein(effectiveFoods, selectedFoods),
    [effectiveFoods, selectedFoods],
  );

  return {
    ready,
    weightKg,
    setWeightRaw,
    coefficient: state?.coefficient ?? 1.5,
    setCoefficient,
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
    savePresetOverride,
    resetPresetOverride,
    addCustomFood,
    updateCustomFood,
    deleteCustomFood,
  };
}
