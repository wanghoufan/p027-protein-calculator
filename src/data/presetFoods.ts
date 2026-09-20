import { FoodDefinition, PresetFoodCategory, ServingOption } from '../types';

const serving = (id: string, label: string, amountInCanonicalUnit: number): ServingOption => ({
  id,
  label,
  amountInCanonicalUnit,
});

function preset(
  id: string,
  category: PresetFoodCategory,
  name: string,
  canonicalType: FoodDefinition['canonicalType'],
  canonicalUnit: FoodDefinition['canonicalUnit'],
  proteinPerBase: number,
  baseAmount: number,
  servingOptions: ServingOption[] = [],
): FoodDefinition {
  return {
    id,
    source: 'preset',
    name,
    category,
    canonicalType,
    canonicalUnit,
    proteinPerBase,
    baseAmount,
    servingOptions,
  };
}

/**
 * V1 预设食物库，数值与 SPEC V1.1 §5 一致。
 * 这些是默认参考常量：用户修改只写入 foodOverrides，本文件不得被运行时改写。
 *
 * V1.4 增量（T087/T088）：新增 Top30 榜单缺失的 24 种 built-in 食物（PLAN §4.2）：
 * - 默认 MASS(g)、baseAmount=100、proteinPerBase=官方排行值；
 * - 鸭蛋/鹌鹑蛋无已核验 serving，按 MASS(g) 加入，不提供“个”快捷份量、不虚构每份数据；
 * - whole-egg/egg-white/chicken-breast/lean-beef/lean-pork/north-tofu 复用 V1.1 实体，
 *   既有计算默认值一字不改（排行榜官方值分层存 proteinRanking.ts，FR-031）。
 */
export const PRESET_FOODS: readonly FoodDefinition[] = [
  // ── V1.1 既有 10 种（不可改动，V1.1 回归基线） ──
  preset('chicken-breast', 'meat', '鸡胸肉', 'mass', 'g', 20, 100, [serving('piece', '1块', 100)]),
  preset('lean-beef', 'meat', '瘦牛肉', 'mass', 'g', 20, 100),
  preset('lean-pork', 'meat', '瘦猪肉', 'mass', 'g', 20, 100),
  preset('whole-egg', 'egg_dairy', '全蛋', 'count', '个', 7, 1, [serving('piece', '1个', 1)]),
  preset('egg-white', 'egg_dairy', '蛋清', 'count', '个', 3.5, 1, [serving('piece', '1个', 1)]),
  preset('milk', 'egg_dairy', '牛奶', 'volume', 'ml', 3.0, 100, [serving('bottle', '1瓶', 250)]),
  preset('shrimp', 'aquatic', '虾', 'mass', 'g', 17, 100),
  preset('fish', 'aquatic', '鱼肉（通用估算）', 'mass', 'g', 17, 100),
  preset('north-tofu', 'soy', '北豆腐', 'mass', 'g', 12, 100),
  preset('soybean', 'soy', '黄豆（干）', 'mass', 'g', 35, 100),
  // ── V1.4 Top30 新增（肉禽） ──
  preset('beef-tenderloin', 'meat', '牛肉（里脊）', 'mass', 'g', 22.2, 100),
  preset('lean-lamb', 'meat', '羊肉（瘦）', 'mass', 'g', 20.5, 100),
  preset('beef-fore-shank', 'meat', '牛肉（前腱）', 'mass', 'g', 20.3, 100),
  preset('pork-tenderloin', 'meat', '猪肉（里脊）', 'mass', 'g', 20.2, 100),
  preset('beef-hind-shank', 'meat', '牛肉（后腱）', 'mass', 'g', 20.1, 100),
  preset('chicken-leg', 'meat', '鸡腿', 'mass', 'g', 16.0, 100),
  preset('duck-breast', 'meat', '鸭胸脯肉', 'mass', 'g', 15.0, 100),
  // ── V1.4 Top30 新增（水产） ──
  preset('mandarin-fish', 'aquatic', '鳜鱼（桂鱼）', 'mass', 'g', 19.9, 100),
  preset('perch', 'aquatic', '鲈鱼', 'mass', 'g', 18.6, 100),
  preset('pomfret', 'aquatic', '鲳鱼', 'mass', 'g', 18.5, 100),
  preset('oriental-prawn', 'aquatic', '东方对虾（中国对虾）', 'mass', 'g', 18.3, 100),
  preset('hairtail', 'aquatic', '带鱼', 'mass', 'g', 17.7, 100),
  preset('carp', 'aquatic', '鲤鱼', 'mass', 'g', 17.6, 100),
  preset('crucian-carp', 'aquatic', '鲫鱼', 'mass', 'g', 17.1, 100),
  preset('sea-shrimp', 'aquatic', '海虾', 'mass', 'g', 16.8, 100),
  preset('grass-carp', 'aquatic', '草鱼', 'mass', 'g', 16.6, 100),
  preset('river-shrimp', 'aquatic', '河虾', 'mass', 'g', 16.4, 100),
  preset('fresh-scallop', 'aquatic', '扇贝（鲜）', 'mass', 'g', 11.1, 100),
  // ── V1.4 Top30 新增（豆类） ──
  preset('tofu-sheet', 'soy', '千张（百页）', 'mass', 'g', 24.5, 100),
  preset('dried-tofu', 'soy', '豆腐干（均值）', 'mass', 'g', 16.2, 100),
  preset('edamame', 'soy', '毛豆（鲜）', 'mass', 'g', 13.1, 100),
  preset('south-tofu', 'soy', '南豆腐', 'mass', 'g', 6.2, 100),
  // ── V1.4 Top30 新增（蛋类；无核验 serving，仅 MASS(g)，T088） ──
  preset('quail-egg', 'egg_dairy', '鹌鹑蛋', 'mass', 'g', 12.8, 100),
  preset('duck-egg', 'egg_dairy', '鸭蛋', 'mass', 'g', 12.6, 100),
] as const;

export const PRESET_FOOD_MAP: ReadonlyMap<string, FoodDefinition> = new Map(
  PRESET_FOODS.map((food) => [food.id, food]),
);

/** 首次安装的当前食物：鸡胸肉、全蛋、牛奶、蛋清，数量均为 0（SPEC US2.2）。 */
export const DEFAULT_SELECTED_FOOD_IDS: readonly string[] = [
  'chicken-breast',
  'whole-egg',
  'milk',
  'egg-white',
] as const;

/** 默认常用区种子（T038：默认4 seed）。 */
export const DEFAULT_RECENT_FOOD_IDS: readonly string[] = DEFAULT_SELECTED_FOOD_IDS;
