import { PRESET_FOOD_MAP } from '../data/presetFoods';
import {
  FoodDefinition,
  LegacyCoefficient,
  PersistedStateV1,
  PersistedStateV2,
  PresetFoodOverride,
  ServingOption,
} from '../types';
import { parsePersistedState } from './schema';
import { normalizeServingOrigin } from '../domain/serving';

/**
 * V1 → V2 单步受控迁移（T126-T128 / SPEC §10 / Principle VIII）：
 * - deterministic / idempotent：同一输入重复执行结果一致，v2 输入原样校验返回；
 * - 先校验后写回：输出必须通过 parsePersistedState 完整校验才交给调用方；
 * - 1.0 → daily/high（值不变，无需提示）；1.5 → fitness/high（1.6）+ 持久 notice；
 * - 损坏/未知状态返回 null，走既有安全回退（不写半成品）；
 * - 任何路径不做 g↔ml 换算，不把旧“份数”解释为克/毫升。
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isLegacyCoefficient(value: unknown): value is LegacyCoefficient {
  return value === 1.0 || value === 1.5;
}

/** V1 override serving origin 归一化：命中基础 serving id → SYSTEM_DEFAULT，否则 USER_DEFINED。 */
function normalizeOverrideServings(
  foodId: string,
  override: PresetFoodOverride,
): PresetFoodOverride {
  if (override.servingOptions === undefined) {
    return override;
  }
  const baseIds = PRESET_FOOD_MAP.get(foodId)?.servingOptions.map((s) => s.id) ?? [];
  return {
    ...override,
    servingOptions: override.servingOptions.map((serving) =>
      normalizeServingOrigin(serving as ServingOption, baseIds),
    ),
  };
}

/** customFoods serving 归一化：用户创建语义，一律 USER_DEFINED。 */
function normalizeCustomFoodServings(food: FoodDefinition): FoodDefinition {
  if (food.servingOptions.length === 0) {
    return food;
  }
  return {
    ...food,
    servingOptions: food.servingOptions.map((serving) => normalizeServingOrigin(serving, [])),
  };
}

/**
 * 迁移入口：接受 v1 / v2 原始对象，输出通过完整校验的 v2 状态。
 * - v2 输入：直接 parsePersistedState（幂等路径）；
 * - v1 输入：确定性转换后必须通过 parsePersistedState，失败返回 null；
 * - 其他：null（安全回退默认状态）。
 */
export function migratePersistedState(raw: unknown): PersistedStateV2 | null {
  if (!isRecord(raw)) {
    return null;
  }
  if (raw.schemaVersion === 2) {
    return parsePersistedState(raw);
  }
  if (raw.schemaVersion !== 1 || !isLegacyCoefficient(raw.coefficient)) {
    return null;
  }

  const legacy = raw as unknown as PersistedStateV1;
  const overrides: Record<string, PresetFoodOverride> = {};
  for (const [foodId, override] of Object.entries(legacy.foodOverrides ?? {})) {
    overrides[foodId] = normalizeOverrideServings(foodId, override);
  }
  const customFoods = (legacy.customFoods ?? []).map(normalizeCustomFoodServings);

  // legacy 目标映射（SPEC §10）：
  // 1.0 → 日常维持/high（计算值不变）；1.5 → 健身维持/high（1.6），持久 notice 到用户确认。
  const migrated: PersistedStateV2 = {
    schemaVersion: 2,
    weightKg: legacy.weightKg,
    proteinGoal:
      legacy.coefficient === 1.0
        ? { mode: 'daily_maintenance', level: 'high' }
        : { mode: 'fitness_maintenance', level: 'high' },
    selectedFoods: legacy.selectedFoods,
    foodOverrides: overrides,
    customFoods,
    recentFoodIds: legacy.recentFoodIds,
    migrationNotices: { goalModelV151Acknowledged: legacy.coefficient === 1.0 },
  };

  // 先校验后写回：输出不合法即放弃（调用方走安全回退），绝不写半成品。
  return parsePersistedState(migrated);
}
