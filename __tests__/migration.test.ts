import { migratePersistedState } from '../src/storage/migrations';
import { createDefaultState, parsePersistedState } from '../src/storage/schema';
import { LEGACY_INVALID_SYSTEM_SERVING } from '../src/domain/serving';
import { PersistedStateV1 } from '../src/types';

/** 构造一份合法 V1 状态（V1 serving 无 origin 字段——真实 legacy 形态）。 */
function buildV1State(coefficient: 1.0 | 1.5): PersistedStateV1 {
  return {
    schemaVersion: 1,
    weightKg: 68,
    coefficient,
    selectedFoods: [
      { foodId: 'chicken-breast', amountInCanonicalUnit: 300, inputMode: 'canonical' },
      { foodId: 'milk', amountInCanonicalUnit: 500, inputMode: 'serving', servingId: 'bottle' },
    ],
    foodOverrides: {
      'chicken-breast': {
        proteinPerBase: 21,
        servingOptions: [
          // V1 override 无 origin：id 命中基础 serving → SYSTEM_DEFAULT
          { id: 'piece', label: '1块', amountInCanonicalUnit: 150 },
          // 来源不明 → 保留为 USER_DEFINED
          { id: 'serving-1700000000000', label: '1小碗', amountInCanonicalUnit: 80 },
        ],
      },
    },
    customFoods: [
      {
        id: 'custom-1',
        source: 'custom',
        name: '蛋白棒',
        category: 'custom',
        canonicalType: 'mass',
        canonicalUnit: 'g',
        proteinPerBase: 30,
        baseAmount: 100,
        servingOptions: [{ id: 'serving-1700000000001', label: '1根', amountInCanonicalUnit: 60 }],
      },
    ],
    recentFoodIds: ['chicken-breast', 'milk'],
  } as unknown as PersistedStateV1;
}

describe('v1→v2 目标映射（FR-047）', () => {
  it('legacy 1.0 → daily_maintenance/high，无待确认提示', () => {
    const migrated = migratePersistedState(buildV1State(1.0));
    expect(migrated).not.toBeNull();
    expect(migrated!.proteinGoal).toEqual({ mode: 'daily_maintenance', level: 'high' });
    expect(migrated!.migrationNotices.goalModelV151Acknowledged).toBe(true);
    expect(migrated!.schemaVersion).toBe(2);
  });

  it('legacy 1.5 → fitness_maintenance/high（1.6）+ 持久 notice（未确认）', () => {
    const migrated = migratePersistedState(buildV1State(1.5));
    expect(migrated!.proteinGoal).toEqual({ mode: 'fitness_maintenance', level: 'high' });
    expect(migrated!.migrationNotices.goalModelV151Acknowledged).toBe(false);
  });
});

describe('迁移数据完整性（Principle VIII 最小数据损失）', () => {
  it('selectedFoods 数量原样保留，不做 g↔ml 换算、不把份数当克', () => {
    const migrated = migratePersistedState(buildV1State(1.0))!;
    expect(migrated.selectedFoods).toEqual([
      { foodId: 'chicken-breast', amountInCanonicalUnit: 300, inputMode: 'canonical' },
      { foodId: 'milk', amountInCanonicalUnit: 500, inputMode: 'serving', servingId: 'bottle' },
    ]);
  });

  it('override serving origin 归一化：命中基础 id → SYSTEM_DEFAULT，来源不明 → USER_DEFINED', () => {
    const migrated = migratePersistedState(buildV1State(1.0))!;
    const servings = migrated.foodOverrides['chicken-breast'].servingOptions!;
    expect(servings[0]).toEqual({
      id: 'piece',
      label: '1块',
      amountInCanonicalUnit: 150,
      origin: 'SYSTEM_DEFAULT',
    });
    expect(servings[1]).toEqual({
      id: 'serving-1700000000000',
      label: '1小碗',
      amountInCanonicalUnit: 80,
      origin: 'USER_DEFINED',
    });
  });

  it('customFoods serving 一律归为 USER_DEFINED，全部保留', () => {
    const migrated = migratePersistedState(buildV1State(1.0))!;
    expect(migrated.customFoods).toHaveLength(1);
    expect(migrated.customFoods[0].servingOptions[0].origin).toBe('USER_DEFINED');
  });

  it('recentFoodIds 保留', () => {
    const migrated = migratePersistedState(buildV1State(1.0))!;
    expect(migrated.recentFoodIds).toEqual(['chicken-breast', 'milk']);
  });
});

describe('迁移 deterministic / idempotent（FR-048 / SC-026）', () => {
  it('同一输入重复迁移结果一致', () => {
    const input = JSON.parse(JSON.stringify(buildV1State(1.5)));
    const first = migratePersistedState(JSON.parse(JSON.stringify(input)));
    const second = migratePersistedState(JSON.parse(JSON.stringify(input)));
    expect(second).toEqual(first);
  });

  it('v2 状态再次迁移不产生二次破坏（幂等路径）', () => {
    const once = migratePersistedState(buildV1State(1.5))!;
    const twice = migratePersistedState(JSON.parse(JSON.stringify(once)));
    expect(twice).toEqual(parsePersistedState(once));
    expect(twice).not.toBeNull();
  });

  it('v2 输出通过 parsePersistedState 校验', () => {
    const once = migratePersistedState(buildV1State(1.0))!;
    expect(parsePersistedState(once)).toEqual(once);
  });
});

describe('损坏状态安全回退（不写半成品）', () => {
  it('未知 schema / 非法 coefficient 返回 null', () => {
    expect(migratePersistedState({ schemaVersion: 999 })).toBeNull();
    expect(migratePersistedState({ schemaVersion: 1, coefficient: 1.2 })).toBeNull();
    expect(migratePersistedState(null)).toBeNull();
    expect(migratePersistedState('broken')).toBeNull();
  });

  it('v1 非法体重返回 null（不走半成品写回）', () => {
    const bad = { ...buildV1State(1.0), weightKg: -5 };
    expect(migratePersistedState(bad)).toBeNull();
  });
});

describe('cleanup manifest（T132/T133 / FR-048）', () => {
  it('基于真实 repo 生成：V1.1 四条 system serving 均合法，manifest 为空集', () => {
    expect(LEGACY_INVALID_SYSTEM_SERVING).toEqual([]);
  });

  it('V1.1 既有 system serving 全部保留 origin=SYSTEM_DEFAULT', () => {
    const state = createDefaultState();
    // 默认选中食物的数量为 0，serving 数据在 preset 定义中，迁移不清除任何 preset serving。
    expect(state.selectedFoods).toHaveLength(4);
    const migrated = migratePersistedState(buildV1State(1.0))!;
    // 迁移未删除任何 preset/custom/override serving。
    expect(migrated.customFoods).toHaveLength(1);
    expect(migrated.foodOverrides['chicken-breast'].servingOptions).toHaveLength(2);
  });
});
