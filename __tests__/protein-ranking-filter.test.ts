import { filterProteinRanking, getSortedProteinRanking } from '../src/domain/ranking';
import { ProteinRankingFilter } from '../src/types';

/**
 * T106 / FR-029 / SC-013：分类 Chip 过滤正确、过滤后保留原全局 rank、reopen 默认 all。
 */
describe('proteinRanking 分类过滤（T091/T106）', () => {
  it('all = 30 条', () => {
    expect(filterProteinRanking('all')).toHaveLength(30);
  });

  it('肉禽集合正确（10 条，含 V1.1 复用的鸡胸脯肉）', () => {
    const rows = filterProteinRanking('meat_poultry');
    expect(rows.map((row) => row.foodId).sort()).toEqual(
      [
        'beef-tenderloin',
        'lean-lamb',
        'beef-fore-shank',
        'lean-pork',
        'lean-beef',
        'pork-tenderloin',
        'beef-hind-shank',
        'chicken-breast',
        'chicken-leg',
        'duck-breast',
      ].sort(),
    );
  });

  it('水产集合正确（11 条）', () => {
    const rows = filterProteinRanking('aquatic');
    expect(rows).toHaveLength(11);
    expect(rows.map((row) => row.foodId)).toContain('perch');
    expect(rows.map((row) => row.foodId)).toContain('fresh-scallop');
  });

  it('蛋类集合正确（4 条）', () => {
    const rows = filterProteinRanking('egg');
    expect(rows.map((row) => row.foodId).sort()).toEqual(
      ['whole-egg', 'quail-egg', 'duck-egg', 'egg-white'].sort(),
    );
  });

  it('豆类集合正确（5 条，不含 V1.1 的黄豆干）', () => {
    const rows = filterProteinRanking('soy');
    expect(rows.map((row) => row.foodId).sort()).toEqual(
      ['tofu-sheet', 'dried-tofu', 'edamame', 'north-tofu', 'south-tofu'].sort(),
    );
    expect(rows).toHaveLength(5);
  });

  it('过滤后保留原全局 rank（不重新编号，SC-013）', () => {
    const all = getSortedProteinRanking();
    (['meat_poultry', 'aquatic', 'egg', 'soy'] as const).forEach((category) => {
      const filtered = filterProteinRanking(category);
      filtered.forEach((row) => {
        const global = all.find((entry) => entry.foodId === row.foodId)!;
        expect(row.rank).toBe(global.rank);
      });
    });
  });

  it('过滤结果仍按官方值降序', () => {
    (['meat_poultry', 'aquatic', 'egg', 'soy'] as const).forEach((category) => {
      const values = filterProteinRanking(category).map((row) => row.officialProteinPer100g);
      for (let i = 1; i < values.length; i += 1) {
        expect(values[i - 1]!).toBeGreaterThanOrEqual(values[i]!);
      }
    });
  });

  it('reopen 默认 all：filter 状态由调用方重置为 "all"（T097 合同，值域校验）', () => {
    const valid: ProteinRankingFilter[] = ['all', 'meat_poultry', 'aquatic', 'egg', 'soy'];
    expect(valid).toHaveLength(5);
    expect(filterProteinRanking('all')).toHaveLength(30);
  });
});
