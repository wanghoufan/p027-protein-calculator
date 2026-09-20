import { ProteinRankingEntry } from '../types';

/**
 * V1.4 Top 30 高蛋白食物榜（FR-027 冻结数据）。
 * 唯一结构化数据真相（PLAN §3.1）：UI 不得再硬编码数值，禁止从用户 override 反推。
 * 口径：蛋白质 g / 100g 可食部；来源：中国疾控《中国食物成分表》查询平台；核验 2026-09。
 * 排序：officialProteinPer100g DESC → tieBreakOrder ASC；rank 由完整 30 条排序后固定。
 */
const RAW_PROTEIN_RANKING: readonly Omit<ProteinRankingEntry, 'rank'>[] = [
  entry(
    'tofu-sheet',
    '千张（百页）',
    'soy',
    24.5,
    1,
    'https://nlc.chinanutri.cn/fq/foodinfo/345.html',
  ),
  entry(
    'beef-tenderloin',
    '牛肉（里脊）',
    'meat_poultry',
    22.2,
    2,
    'https://nlc.chinanutri.cn/fq/foodinfo/827.html',
  ),
  entry(
    'lean-lamb',
    '羊肉（瘦）',
    'meat_poultry',
    20.5,
    3,
    'https://nlc.chinanutri.cn/fq/foodinfo/850.html',
  ),
  entry(
    'beef-fore-shank',
    '牛肉（前腱）',
    'meat_poultry',
    20.3,
    4,
    'https://nlc.chinanutri.cn/fq/foodinfo/829.html',
  ),
  entry(
    'lean-pork',
    '猪肉（瘦）',
    'meat_poultry',
    20.3,
    5,
    'https://nlc.chinanutri.cn/fq/foodinfo/788.html',
  ),
  entry(
    'lean-beef',
    '牛肉（瘦）',
    'meat_poultry',
    20.2,
    6,
    'https://nlc.chinanutri.cn/fq/foodinfo/830.html',
  ),
  entry(
    'pork-tenderloin',
    '猪肉（里脊）',
    'meat_poultry',
    20.2,
    7,
    'https://nlc.chinanutri.cn/fq/foodinfo/784.html',
  ),
  entry(
    'beef-hind-shank',
    '牛肉（后腱）',
    'meat_poultry',
    20.1,
    8,
    'https://nlc.chinanutri.cn/fq/foodinfo/826.html',
  ),
  entry(
    'mandarin-fish',
    '鳜鱼（桂鱼）',
    'aquatic',
    19.9,
    9,
    'https://nlc.chinanutri.cn/fq/foodinfo/1026.html',
  ),
  entry(
    'chicken-breast',
    '鸡胸脯肉',
    'meat_poultry',
    19.4,
    10,
    'https://nlc.chinanutri.cn/fq/foodinfo/880.html',
  ),
  entry('perch', '鲈鱼', 'aquatic', 18.6, 11, 'https://nlc.chinanutri.cn/fq/foodinfo/1050.html'),
  entry('pomfret', '鲳鱼', 'aquatic', 18.5, 12, 'https://nlc.chinanutri.cn/fq/foodinfo/1056.html'),
  entry(
    'oriental-prawn',
    '东方对虾（中国对虾）',
    'aquatic',
    18.3,
    13,
    'https://nlc.chinanutri.cn/fq/foodinfo/1090.html',
  ),
  entry('hairtail', '带鱼', 'aquatic', 17.7, 14, 'https://nlc.chinanutri.cn/fq/foodinfo/1030.html'),
  entry('carp', '鲤鱼', 'aquatic', 17.6, 15, 'https://nlc.chinanutri.cn/fq/foodinfo/1012.html'),
  entry(
    'crucian-carp',
    '鲫鱼',
    'aquatic',
    17.1,
    16,
    'https://nlc.chinanutri.cn/fq/foodinfo/1021.html',
  ),
  entry(
    'sea-shrimp',
    '海虾',
    'aquatic',
    16.8,
    17,
    'https://nlc.chinanutri.cn/fq/foodinfo/1091.html',
  ),
  entry(
    'grass-carp',
    '草鱼',
    'aquatic',
    16.6,
    18,
    'https://nlc.chinanutri.cn/fq/foodinfo/1003.html',
  ),
  entry(
    'river-shrimp',
    '河虾',
    'aquatic',
    16.4,
    19,
    'https://nlc.chinanutri.cn/fq/foodinfo/1092.html',
  ),
  entry(
    'dried-tofu',
    '豆腐干（均值）',
    'soy',
    16.2,
    20,
    'https://nlc.chinanutri.cn/fq/foodinfo/346.html',
  ),
  entry(
    'chicken-leg',
    '鸡腿',
    'meat_poultry',
    16.0,
    21,
    'https://nlc.chinanutri.cn/fq/foodinfo/882.html',
  ),
  entry(
    'duck-breast',
    '鸭胸脯肉',
    'meat_poultry',
    15.0,
    22,
    'https://nlc.chinanutri.cn/fq/foodinfo/892.html',
  ),
  entry(
    'whole-egg',
    '鸡蛋（均值）',
    'egg',
    13.3,
    23,
    'https://nlc.chinanutri.cn/fq/foodinfo/978.html',
  ),
  entry('edamame', '毛豆（鲜）', 'soy', 13.1, 24, 'https://nlc.chinanutri.cn/fq/foodinfo/391.html'),
  entry('quail-egg', '鹌鹑蛋', 'egg', 12.8, 25, 'https://nlc.chinanutri.cn/fq/foodinfo/1001.html'),
  entry('duck-egg', '鸭蛋', 'egg', 12.6, 26, 'https://nlc.chinanutri.cn/fq/foodinfo/990.html'),
  entry('north-tofu', '北豆腐', 'soy', 12.2, 27, 'https://nlc.chinanutri.cn/fq/foodinfo/334.html'),
  entry('egg-white', '鸡蛋白', 'egg', 11.6, 28, 'https://nlc.chinanutri.cn/fq/foodinfo/982.html'),
  entry(
    'fresh-scallop',
    '扇贝（鲜）',
    'aquatic',
    11.1,
    29,
    'https://nlc.chinanutri.cn/fq/foodinfo/1114.html',
  ),
  entry('south-tofu', '南豆腐', 'soy', 6.2, 30, 'https://nlc.chinanutri.cn/fq/foodinfo/335.html'),
];

function entry(
  foodId: string,
  rankingDisplayName: string,
  category: ProteinRankingEntry['category'],
  officialProteinPer100g: number,
  tieBreakOrder: number,
  sourceUrl: string,
): Omit<ProteinRankingEntry, 'rank'> {
  return {
    foodId,
    rankingDisplayName,
    category,
    officialProteinPer100g,
    comparisonBasis: '100g_edible_portion',
    sourceName: '中国疾病预防控制中心营养与健康所《中国食物成分表》查询平台',
    sourceUrl,
    checkedAt: '2026-09',
    tieBreakOrder,
  };
}

/** 完整 30 条按官方值降序 + tieBreakOrder 稳定排序后的带全局 rank 榜单。 */
export const PROTEIN_RANKING: readonly ProteinRankingEntry[] = [...RAW_PROTEIN_RANKING]
  .sort(
    (a, b) =>
      b.officialProteinPer100g - a.officialProteinPer100g || a.tieBreakOrder - b.tieBreakOrder,
  )
  .map((item, index) => ({ ...item, rank: index + 1 }));
