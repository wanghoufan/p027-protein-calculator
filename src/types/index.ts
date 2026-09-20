export type CanonicalType = 'mass' | 'volume' | 'count';

export type CountUnit = '个' | '块' | '瓶' | '盒' | '袋' | '根';

export type CanonicalUnit = 'g' | 'ml' | CountUnit;

/**
 * V1.5.1 四模式目标（SPEC §3 冻结表）。
 * coefficient 一律由 mode+level 派生，不再作为第二权威字段持久化。
 */
export type ProteinGoalMode =
  'daily_maintenance' | 'fitness_maintenance' | 'muscle_gain' | 'fat_loss_muscle_retention';

export type ProteinGoalLevel = 'low' | 'high';

export interface ProteinGoalSelection {
  mode: ProteinGoalMode;
  level: ProteinGoalLevel;
}

/** V1 legacy 裸系数（仅迁移解析用，V1.5.1 起不再持久化）。 */
export type LegacyCoefficient = 1.0 | 1.5;

export type PresetFoodCategory = 'meat' | 'egg_dairy' | 'aquatic' | 'soy';

export type FoodCategory = PresetFoodCategory | 'custom';

/**
 * Serving 来源（V1.5.1 Principle VI）：
 * - SYSTEM_DEFAULT：系统明确提供的基础快捷份量；
 * - USER_DEFINED：用户新增的常用份量。
 * 系统默认被用户修改走既有 override 机制，origin 不变，运行时派生 isOverridden。
 */
export type ServingOrigin = 'SYSTEM_DEFAULT' | 'USER_DEFINED';

export interface ServingOption {
  id: string;
  label: string;
  amountInCanonicalUnit: number;
  origin: ServingOrigin;
}

export interface FoodDefinition {
  id: string;
  source: 'preset' | 'custom';
  name: string;
  category: FoodCategory;
  canonicalType: CanonicalType;
  canonicalUnit: CanonicalUnit;
  proteinPerBase: number;
  baseAmount: number;
  servingOptions: ServingOption[];
}

export interface PresetFoodOverride {
  proteinPerBase?: number;
  baseAmount?: number;
  servingOptions?: ServingOption[];
}

export type InputMode = 'canonical' | 'serving';

export interface SelectedFood {
  foodId: string;
  amountInCanonicalUnit: number;
  inputMode: InputMode;
  servingId?: string;
}

export type Coefficient = LegacyCoefficient;

/** V1 schema（仅迁移解析用）。 */
export interface PersistedStateV1 {
  schemaVersion: 1;
  weightKg: number;
  coefficient: Coefficient;
  selectedFoods: SelectedFood[];
  foodOverrides: Record<string, PresetFoodOverride>;
  customFoods: FoodDefinition[];
  recentFoodIds: string[];
}

/**
 * V1.5.1 权威持久化状态（SPEC §10）：
 * - proteinGoal 为目标真相，coefficient 派生不持久化；
 * - migrationNotices 记录 legacy 1.5→1.6 提示是否已被用户确认（持久到确认）。
 */
export interface MigrationNotices {
  goalModelV151Acknowledged: boolean;
}

export interface PersistedStateV2 {
  schemaVersion: 2;
  weightKg: number;
  proteinGoal: ProteinGoalSelection;
  selectedFoods: SelectedFood[];
  foodOverrides: Record<string, PresetFoodOverride>;
  customFoods: FoodDefinition[];
  recentFoodIds: string[];
  migrationNotices: MigrationNotices;
}

/** 当前权威持久化状态（随 schema 升级演进）。 */
export type PersistedState = PersistedStateV2;

export type ProteinBalance =
  | { type: 'remaining'; amount: number }
  | { type: 'over'; amount: number }
  | { type: 'met'; amount: 0 };

/**
 * 四模式 8 档冻结系数表（SPEC V1.5.1 §3 / Constitution Principle II）。
 * 产品化映射：不宣称任何单一官方四模式标准（Principle III）。
 */
export const PROTEIN_GOAL_MODES: Readonly<Record<ProteinGoalMode, { low: number; high: number }>> =
  {
    daily_maintenance: { low: 0.8, high: 1.0 },
    fitness_maintenance: { low: 1.2, high: 1.6 },
    muscle_gain: { low: 1.6, high: 2.0 },
    fat_loss_muscle_retention: { low: 1.6, high: 2.4 },
  } as const;

export const PROTEIN_GOAL_MODE_IDS: readonly ProteinGoalMode[] = [
  'daily_maintenance',
  'fitness_maintenance',
  'muscle_gain',
  'fat_loss_muscle_retention',
] as const;

export const COUNT_UNITS: readonly CountUnit[] = ['个', '块', '瓶', '盒', '袋', '根'] as const;

export const PRESET_CATEGORIES: readonly { id: PresetFoodCategory; label: string }[] = [
  { id: 'meat', label: '肉类' },
  { id: 'egg_dairy', label: '蛋奶类' },
  { id: 'aquatic', label: '水产类' },
  { id: 'soy', label: '豆制品' },
] as const;

export const MAX_RECENT_FOODS = 4;

/**
 * V1.4 排行榜 UI 分类（SPEC Chip：全部/肉禽/水产/蛋类/豆类）。
 * 与 V1.1 registry 分类映射：meat_poultry→meat、egg→egg_dairy、aquatic→aquatic、soy→soy；
 * 只做映射，不改 V1.1 PresetFoodCategory 语义。
 */
export type ProteinRankingCategory = 'meat_poultry' | 'aquatic' | 'egg' | 'soy';

export type ProteinRankingFilter = ProteinRankingCategory | 'all';

export const RANKING_FILTERS: readonly { id: ProteinRankingFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'meat_poultry', label: '肉禽' },
  { id: 'aquatic', label: '水产' },
  { id: 'egg', label: '蛋类' },
  { id: 'soy', label: '豆类' },
] as const;

export const RANKING_CATEGORY_TO_FOOD_CATEGORY: Readonly<
  Record<ProteinRankingCategory, PresetFoodCategory>
> = {
  meat_poultry: 'meat',
  aquatic: 'aquatic',
  egg: 'egg_dairy',
  soy: 'soy',
};

export interface ProteinRankingEntry {
  foodId: string;
  rankingDisplayName: string;
  category: ProteinRankingCategory;
  /** 官方排行值（FR-031 分层）：仅用于排名与展示，与用户 override / 计算值互不覆盖。 */
  officialProteinPer100g: number;
  comparisonBasis: '100g_edible_portion';
  sourceName: string;
  sourceUrl: string;
  checkedAt: '2026-09';
  tieBreakOrder: number;
  /** 完整 30 条排序后的固定全局 rank；筛选时保持原值不重排（FR-029）。 */
  rank: number;
}
