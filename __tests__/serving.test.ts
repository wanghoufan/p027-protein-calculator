import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProteinCalculator } from '../src/hooks/useProteinCalculator';
import {
  canUseServingMode,
  getServingOverrideState,
  validateServingInput,
} from '../src/domain/serving';
import { STORAGE_KEY } from '../src/storage/schema';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('getServingOverrideState（SPEC §6 派生 isOverridden）', () => {
  const base = {
    id: 'piece',
    label: '1块',
    amountInCanonicalUnit: 100,
    origin: 'SYSTEM_DEFAULT' as const,
  };

  it('与原始系统值一致 → 未覆盖', () => {
    expect(getServingOverrideState(base, { ...base })).toEqual({ isOverridden: false });
  });

  it('label 变化 → 已覆盖（origin 不参与比较）', () => {
    expect(getServingOverrideState(base, { ...base, label: '1大块' })).toEqual({
      isOverridden: true,
    });
  });

  it('amount 变化 → 已覆盖', () => {
    expect(getServingOverrideState(base, { ...base, amountInCanonicalUnit: 120 })).toEqual({
      isOverridden: true,
    });
  });
});

describe('canUseServingMode（T134 / FR-044）', () => {
  it('有 serving 可用，无 serving 禁用', () => {
    expect(
      canUseServingMode({
        servingOptions: [
          { id: 'a', label: '1块', amountInCanonicalUnit: 100, origin: 'SYSTEM_DEFAULT' },
        ],
      }),
    ).toBe(true);
    expect(canUseServingMode({ servingOptions: [] })).toBe(false);
  });
});

describe('validateServingInput（FR-045/FR-055）', () => {
  it('label trim 后非空、amount finite>0 通过', () => {
    expect(validateServingInput(' 1碗 ', 80)).toEqual({ valid: true, errors: [] });
  });

  it('空名/NaN/0/负数拒绝', () => {
    expect(validateServingInput('   ', 80).valid).toBe(false);
    expect(validateServingInput('1碗', NaN).valid).toBe(false);
    expect(validateServingInput('1碗', Infinity).valid).toBe(false);
    expect(validateServingInput('1碗', 0).valid).toBe(false);
    expect(validateServingInput('1碗', -1).valid).toBe(false);
  });
});

describe('USER_DEFINED serving CRUD（hook 级）', () => {
  it('为无 serving 的食物新增 → 出现 USER_DEFINED 份量并可按份记录', async () => {
    const { result } = renderHook(() => useProteinCalculator());
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => result.current.addFood('lean-beef')); // V1.1 preset，无 serving
    const before = result.current.getFoodById('lean-beef')!;
    expect(before.servingOptions).toHaveLength(0);

    let opResult = { ok: false, errors: [] as string[] };
    act(() => {
      opResult = result.current.addUserServing('lean-beef', '1份', 200);
    });
    expect(opResult.ok).toBe(true);

    const after = result.current.getFoodById('lean-beef')!;
    expect(after.servingOptions).toHaveLength(1);
    expect(after.servingOptions[0].origin).toBe('USER_DEFINED');
    expect(after.servingOptions[0].amountInCanonicalUnit).toBe(200);

    act(() => {
      result.current.setAmountServing('lean-beef', after.servingOptions[0], 2);
    });
    const selected = result.current.selectedFoods.find((s) => s.foodId === 'lean-beef')!;
    expect(selected.inputMode).toBe('serving');
    expect(selected.amountInCanonicalUnit).toBe(400);
  });

  it('非法输入拒绝写权威状态', async () => {
    const { result } = renderHook(() => useProteinCalculator());
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => result.current.addFood('lean-beef'));
    let opResult = { ok: true, errors: [] as string[] };
    act(() => {
      opResult = result.current.addUserServing('lean-beef', '  ', 0);
    });
    expect(opResult.ok).toBe(false);
    expect(result.current.getFoodById('lean-beef')!.servingOptions).toHaveLength(0);
  });

  it('删除 USER_DEFINED serving：引用行回 canonical、清 servingId、量 0（FR-046）', async () => {
    const { result } = renderHook(() => useProteinCalculator());
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => result.current.addFood('lean-beef'));
    act(() => {
      result.current.addUserServing('lean-beef', '1份', 200);
    });
    const serving = result.current.getFoodById('lean-beef')!.servingOptions[0];
    act(() => {
      result.current.setAmountServing('lean-beef', serving, 2);
    });
    let opResult = { ok: false, errors: [] as string[] };
    act(() => {
      opResult = result.current.deleteUserServing('lean-beef', serving.id);
    });
    expect(opResult.ok).toBe(true);

    const selected = result.current.selectedFoods.find((s) => s.foodId === 'lean-beef')!;
    expect(selected.inputMode).toBe('canonical');
    expect(selected.servingId).toBeUndefined();
    expect(selected.amountInCanonicalUnit).toBe(0);
    expect(result.current.getFoodById('lean-beef')!.servingOptions).toHaveLength(0);
  });

  it('SYSTEM_DEFAULT serving 不可删除；编辑保持 origin=SYSTEM_DEFAULT（Principle VI）', async () => {
    const { result } = renderHook(() => useProteinCalculator());
    await waitFor(() => expect(result.current.ready).toBe(true));

    const chicken = result.current.getFoodById('chicken-breast')!;
    expect(chicken.servingOptions[0].origin).toBe('SYSTEM_DEFAULT');

    let opResult = { ok: true, errors: [] as string[] };
    act(() => {
      opResult = result.current.deleteUserServing('chicken-breast', chicken.servingOptions[0].id);
    });
    expect(opResult.ok).toBe(false);

    act(() => {
      opResult = result.current.updateUserServing(
        'chicken-breast',
        chicken.servingOptions[0].id,
        '1大块',
        120,
      );
    });
    expect(opResult.ok).toBe(true);
    const edited = result.current.getFoodById('chicken-breast')!.servingOptions[0];
    expect(edited.label).toBe('1大块');
    expect(edited.amountInCanonicalUnit).toBe(120);
    expect(edited.origin).toBe('SYSTEM_DEFAULT');
    expect(result.current.foodOverrides['chicken-breast']).toBeDefined();
  });

  it('迁移后持久 notice 持续到确认；确认后消失并落盘', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        weightKg: 70,
        coefficient: 1.5,
        selectedFoods: [
          { foodId: 'chicken-breast', amountInCanonicalUnit: 0, inputMode: 'canonical' },
        ],
        foodOverrides: {},
        customFoods: [],
        recentFoodIds: [],
      }),
    );

    const { result } = renderHook(() => useProteinCalculator());
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.proteinGoal).toEqual({ mode: 'fitness_maintenance', level: 'high' });
    expect(result.current.goalModelNoticePending).toBe(true);

    act(() => result.current.acknowledgeGoalModelNotice());
    expect(result.current.goalModelNoticePending).toBe(false);

    // kill/reopen：确认持久化
    await waitFor(async () => {
      const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? '{}');
      expect(stored.migrationNotices?.goalModelV151Acknowledged).toBe(true);
    });
  });
});
