export type CanonicalType = 'mass' | 'volume' | 'count';

export type CountUnit = '个' | '块' | '瓶' | '盒' | '袋' | '根';

export type CanonicalUnit = 'g' | 'ml' | CountUnit;

export type PresetFoodCategory = 'meat' | 'egg_dairy' | 'aquatic' | 'soy';

export type FoodCategory = PresetFoodCategory | 'custom';

export interface ServingOption {
  id: string;
  label: string;
  amountInCanonicalUnit: number;
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

export type Coefficient = 1.0 | 1.5;

export interface PersistedStateV1 {
  schemaVersion: 1;
  weightKg: number;
  coefficient: Coefficient;
  selectedFoods: SelectedFood[];
  foodOverrides: Record<string, PresetFoodOverride>;
  customFoods: FoodDefinition[];
  recentFoodIds: string[];
}

export type ProteinBalance =
  | { type: 'remaining'; amount: number }
  | { type: 'over'; amount: number }
  | { type: 'met'; amount: 0 };

export const COEFFICIENTS: readonly Coefficient[] = [1.0, 1.5] as const;

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
