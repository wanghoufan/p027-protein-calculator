import { PROTEIN_RANKING } from '../src/data/proteinRanking';
import { PRESET_FOOD_MAP, PRESET_FOODS } from '../src/data/presetFoods';
import { getSortedProteinRanking, filterProteinRanking } from '../src/domain/ranking';

/**
 * V1.5.1 Top30 invariant（T147-T149 / FR-044 / FR-049）：
 * officialProteinPer100g 只用于排名展示；ProteinRankingEntry 永不自动生成 serving。
 */
describe('Top30 × V1.5.1 serving invariant（SC-024/SC-027）', () => {
  it('30 条冻结数据、rank 1..30 固定、每条指向已知 preset 食物', () => {
    expect(PROTEIN_RANKING).toHaveLength(30);
    const sorted = getSortedProteinRanking();
    sorted.forEach((entry, index) => {
      expect(entry.rank).toBe(index + 1);
      expect(PRESET_FOOD_MAP.has(entry.foodId)).toBe(true);
    });
  });

  it('筛选保留全局 rank，不重排（FR-029 回归）', () => {
    const aquatic = filterProteinRanking('aquatic');
    expect(aquatic.length).toBeGreaterThan(0);
    for (const entry of aquatic) {
      expect(entry.rank).toBe(
        getSortedProteinRanking().find((e) => e.foodId === entry.foodId)!.rank,
      );
    }
  });

  it('V1.4 新增 24 种 Top30 食物 servingOptions 恒为空，不会获得 system serving', () => {
    const v11Ids = new Set([
      'chicken-breast',
      'lean-beef',
      'lean-pork',
      'whole-egg',
      'egg-white',
      'milk',
      'shrimp',
      'fish',
      'north-tofu',
      'soybean',
    ]);
    const rankingFoodIds = new Set(PROTEIN_RANKING.map((entry) => entry.foodId));
    for (const food of PRESET_FOODS) {
      if (rankingFoodIds.has(food.id) && !v11Ids.has(food.id)) {
        expect(food.servingOptions).toEqual([]);
      }
    }
  });

  it('V1.1 既有 4 条 system serving 保留且 origin=SYSTEM_DEFAULT', () => {
    const expected = [
      ['chicken-breast', 'piece', 100],
      ['whole-egg', 'piece', 1],
      ['egg-white', 'piece', 1],
      ['milk', 'bottle', 250],
    ] as const;
    for (const [foodId, servingId, amount] of expected) {
      const food = PRESET_FOOD_MAP.get(foodId)!;
      const serving = food.servingOptions.find((option) => option.id === servingId);
      expect(serving).toBeDefined();
      expect(serving!.amountInCanonicalUnit).toBe(amount);
      expect(serving!.origin).toBe('SYSTEM_DEFAULT');
    }
  });

  it('排行榜数据结构不含任何 serving 字段（层级隔离：FR-031/Principle VII）', () => {
    for (const entry of PROTEIN_RANKING) {
      expect(entry).not.toHaveProperty('servingOptions');
      expect(entry).not.toHaveProperty('servingId');
    }
  });
});
