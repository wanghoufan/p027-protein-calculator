import {
  PRESET_FOOD_MAP,
  DEFAULT_SELECTED_FOOD_IDS,
  DEFAULT_RECENT_FOOD_IDS,
} from '../data/presetFoods';
import { FoodDefinition, MigrationNotices, PersistedStateV2, SelectedFood } from '../types';
import { DEFAULT_PROTEIN_GOAL, isValidProteinGoalSelection } from '../domain/proteinGoal';

export const STORAGE_KEY = 'protein-calculator/state';

/** 当前权威 schema 版本（V1.5.1：1 → 2，四模式目标取代裸系数）。 */
export const SCHEMA_VERSION = 2 as const;

/** 首次安装安全默认值：60kg、日常维持/高档/1.0、预选鸡胸/全蛋/牛奶/蛋清、数量 0。 */
export function createDefaultState(): PersistedStateV2 {
  return {
    schemaVersion: SCHEMA_VERSION,
    weightKg: 60,
    proteinGoal: { ...DEFAULT_PROTEIN_GOAL },
    selectedFoods: DEFAULT_SELECTED_FOOD_IDS.map((foodId): SelectedFood => ({
      foodId,
      amountInCanonicalUnit: 0,
      inputMode: 'canonical',
    })),
    foodOverrides: {},
    customFoods: [],
    recentFoodIds: [...DEFAULT_RECENT_FOOD_IDS],
    migrationNotices: { goalModelV151Acknowledged: true },
  };
}

const DEFAULT_MIGRATION_NOTICES: MigrationNotices = { goalModelV151Acknowledged: true };

function isValidSelectedFood(value: unknown): value is SelectedFood {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.foodId === 'string' &&
    typeof item.amountInCanonicalUnit === 'number' &&
    Number.isFinite(item.amountInCanonicalUnit) &&
    (item.inputMode === 'canonical' || item.inputMode === 'serving')
  );
}

function sanitizeAmount(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * foodOverrides 脏数据清洗（CODE-REVIEW P1-2，V1.5.1 扩展 origin）：
 * 仅保留 proteinPerBase>0 / baseAmount>0 / serving 每项 amount>0 的 override，
 * 任一字段非法即丢弃整个 foodId 条目，防止穿透到计算。
 */
function isValidOverride(value: unknown): value is PersistedStateV2['foodOverrides'][string] {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const override = value as Record<string, unknown>;
  if (override.proteinPerBase !== undefined && !isPositiveFinite(override.proteinPerBase)) {
    return false;
  }
  if (override.baseAmount !== undefined && !isPositiveFinite(override.baseAmount)) {
    return false;
  }
  if (override.servingOptions !== undefined) {
    if (!Array.isArray(override.servingOptions)) {
      return false;
    }
    if (
      override.servingOptions.some(
        (serving) =>
          typeof serving !== 'object' ||
          serving === null ||
          typeof (serving as Record<string, unknown>).id !== 'string' ||
          typeof (serving as Record<string, unknown>).label !== 'string' ||
          !isPositiveFinite((serving as Record<string, unknown>).amountInCanonicalUnit),
      )
    ) {
      return false;
    }
  }
  return true;
}

function sanitizeFoodOverrides(raw: unknown): PersistedStateV2['foodOverrides'] {
  const result: PersistedStateV2['foodOverrides'] = {};
  for (const [foodId, override] of Object.entries(raw as Record<string, unknown>)) {
    if (isValidOverride(override)) {
      result[foodId] = override;
    }
  }
  return result;
}

function isValidMigrationNotices(value: unknown): value is MigrationNotices {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return typeof (value as MigrationNotices).goalModelV151Acknowledged === 'boolean';
}

/**
 * V2 运行时最小校验 + orphan 清理：
 * - schemaVersion 必须为 2（未知版本由迁移层处理，这里返回 null）；
 * - proteinGoal 必须是合法四模式选择；
 * - selectedFoods/recentFoodIds 指向不存在的 preset/custom 时清理；
 * - recentFoodIds 截断为最多 4 个；
 * - 非法 amount 钳制为 0；
 * - serving 模式指向失效 servingId 时回 canonical、清 servingId、数量归 0（FR-046）。
 * 校验失败返回 null，由调用方安全回退默认状态。
 */
export function parsePersistedState(raw: unknown): PersistedStateV2 | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const candidate = raw as Record<string, unknown>;
  if (candidate.schemaVersion !== SCHEMA_VERSION) {
    return null;
  }
  if (
    typeof candidate.weightKg !== 'number' ||
    !Number.isFinite(candidate.weightKg) ||
    candidate.weightKg <= 0
  ) {
    return null;
  }
  if (!isValidProteinGoalSelection(candidate.proteinGoal)) {
    return null;
  }
  if (
    !Array.isArray(candidate.selectedFoods) ||
    candidate.selectedFoods.some((item) => !isValidSelectedFood(item))
  ) {
    return null;
  }
  if (typeof candidate.foodOverrides !== 'object' || candidate.foodOverrides === null) {
    return null;
  }
  if (!Array.isArray(candidate.customFoods)) {
    return null;
  }
  if (
    !Array.isArray(candidate.recentFoodIds) ||
    candidate.recentFoodIds.some((id) => typeof id !== 'string')
  ) {
    return null;
  }
  if (
    candidate.migrationNotices !== undefined &&
    !isValidMigrationNotices(candidate.migrationNotices)
  ) {
    return null;
  }

  const customFoods = (candidate.customFoods as PersistedStateV2['customFoods']).filter(
    (food): food is PersistedStateV2['customFoods'][number] =>
      typeof food === 'object' && food !== null && typeof (food as FoodDefinition).id === 'string',
  );
  const customIdSet = new Set(customFoods.map((food) => food.id));

  const knownIds = (id: string): boolean => PRESET_FOOD_MAP.has(id) || customIdSet.has(id);

  const selectedFoods = (candidate.selectedFoods as SelectedFood[])
    .filter((item) => knownIds(item.foodId))
    .map((item) => ({
      ...item,
      amountInCanonicalUnit: sanitizeAmount(item.amountInCanonicalUnit),
    }));

  const recentFoodIds = (candidate.recentFoodIds as string[])
    .filter((id, index, arr) => knownIds(id) && arr.indexOf(id) === index)
    .slice(0, 4);

  return {
    schemaVersion: SCHEMA_VERSION,
    weightKg: candidate.weightKg,
    proteinGoal: candidate.proteinGoal,
    selectedFoods,
    foodOverrides: sanitizeFoodOverrides(candidate.foodOverrides),
    customFoods,
    recentFoodIds,
    migrationNotices:
      candidate.migrationNotices === undefined
        ? DEFAULT_MIGRATION_NOTICES
        : candidate.migrationNotices,
  };
}
