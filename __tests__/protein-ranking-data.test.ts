import { PROTEIN_RANKING } from '../src/data/proteinRanking';
import { PRESET_FOOD_MAP } from '../src/data/presetFoods';
import { getSortedProteinRanking } from '../src/domain/ranking';

/**
 * T090 / SC-012：Top30 冻结数据完整性。
 * 数据真相：src/data/proteinRanking.ts（SPEC V1.4 §6 冻结表）。
 */
describe('proteinRanking 数据（T086/T090，FR-027/SC-012）', () => {
  it('恰好 30 条', () => {
    expect(PROTEIN_RANKING).toHaveLength(30);
  });

  it('foodId 唯一', () => {
    const ids = PROTEIN_RANKING.map((entry) => entry.foodId);
    expect(new Set(ids).size).toBe(30);
  });

  it('officialProteinPer100g 均为正数', () => {
    PROTEIN_RANKING.forEach((entry) => {
      expect(entry.officialProteinPer100g).toBeGreaterThan(0);
    });
  });

  it('来源字段完整（sourceName/sourceUrl/checkedAt/comparisonBasis）', () => {
    PROTEIN_RANKING.forEach((entry) => {
      expect(entry.sourceName.length).toBeGreaterThan(0);
      expect(entry.sourceUrl).toMatch(/^https:\/\/nlc\.chinanutri\.cn\/fq\/foodinfo\/\d+\.html$/);
      expect(entry.checkedAt).toBe('2026-09');
      expect(entry.comparisonBasis).toBe('100g_edible_portion');
    });
  });

  it('按官方值降序稳定排序（单调不增）', () => {
    const values = getSortedProteinRanking().map((entry) => entry.officialProteinPer100g);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i - 1]).toBeGreaterThanOrEqual(values[i]!);
    }
  });

  it('前三名冻结：千张 24.5 / 牛里脊 22.2 / 羊肉(瘦) 20.5', () => {
    const [first, second, third] = getSortedProteinRanking();
    expect(first!.foodId).toBe('tofu-sheet');
    expect(first!.officialProteinPer100g).toBe(24.5);
    expect(second!.foodId).toBe('beef-tenderloin');
    expect(second!.officialProteinPer100g).toBe(22.2);
    expect(third!.foodId).toBe('lean-lamb');
    expect(third!.officialProteinPer100g).toBe(20.5);
  });

  it('同分平局按冻结表顺序：牛肉(前腱)rank4 在 猪肉(瘦)rank5 前、牛肉(瘦)rank6 在 猪肉(里脊)rank7 前', () => {
    const byId = new Map(getSortedProteinRanking().map((entry) => [entry.foodId, entry]));
    expect(byId.get('beef-fore-shank')!.rank).toBe(4);
    expect(byId.get('lean-pork')!.rank).toBe(5);
    expect(byId.get('lean-beef')!.rank).toBe(6);
    expect(byId.get('pork-tenderloin')!.rank).toBe(7);
  });

  it('rank 为连续 1..30 且与排序一致', () => {
    const ranks = getSortedProteinRanking().map((entry) => entry.rank);
    expect(ranks).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it('所有 foodId 都能在 built-in registry resolve（FR-030，无孤儿 ID）', () => {
    PROTEIN_RANKING.forEach((entry) => {
      expect(PRESET_FOOD_MAP.has(entry.foodId)).toBe(true);
    });
  });

  it('V1.1 既有食物计算默认值未被 V1.4 改动（FR-031 分层，T099）', () => {
    const chickenBreast = PRESET_FOOD_MAP.get('chicken-breast')!;
    expect(chickenBreast.proteinPerBase).toBe(20); // 官方 19.4 只存在于排行榜
    const wholeEgg = PRESET_FOOD_MAP.get('whole-egg')!;
    expect(wholeEgg.canonicalType).toBe('count');
    expect(wholeEgg.proteinPerBase).toBe(7); // 保持 7g/个，不用原型 6.3g/个
    const northTofu = PRESET_FOOD_MAP.get('north-tofu')!;
    expect(northTofu.proteinPerBase).toBe(12); // 官方 12.2 只存在于排行榜
  });

  it('新增鸭蛋/鹌鹑蛋为 MASS(g) 且无 COUNT serving（T088/FR-033/SC-016）', () => {
    ['duck-egg', 'quail-egg'].forEach((foodId) => {
      const food = PRESET_FOOD_MAP.get(foodId)!;
      expect(food.canonicalType).toBe('mass');
      expect(food.canonicalUnit).toBe('g');
      expect(food.baseAmount).toBe(100);
      expect(food.servingOptions).toHaveLength(0);
    });
  });
});
