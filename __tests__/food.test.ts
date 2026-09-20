import { PRESET_FOOD_MAP, PRESET_FOODS } from '../src/data/presetFoods';
import {
  removeCustomFoodReferences,
  resolvePresetFood,
  updateRecentFoodIds,
} from '../src/domain/food';
import { FoodDefinition, PersistedStateV1 } from '../src/types';

const chickenBreast = PRESET_FOOD_MAP.get('chicken-breast')!;

const customFood: FoodDefinition = {
  id: 'custom-protein-bar',
  source: 'custom',
  name: '蛋白棒',
  category: 'custom',
  canonicalType: 'count',
  canonicalUnit: '根',
  proteinPerBase: 20,
  baseAmount: 1,
  servingOptions: [],
};

describe('preset 食物库（T009；V1.4 T087 扩展至 34 种）', () => {
  it('共 34 种 preset 食物（V1.1 10 种 + V1.4 Top30 新增 24 种）', () => {
    expect(PRESET_FOODS).toHaveLength(34);
  });

  it('含 SPEC 全部食物 ID', () => {
    const ids = PRESET_FOODS.map((food) => food.id);
    expect(ids).toEqual(
      expect.arrayContaining([
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
      ]),
    );
  });

  it('默认值与 SPEC §5 一致', () => {
    const milk = PRESET_FOOD_MAP.get('milk')!;
    expect(milk.proteinPerBase).toBe(3.0);
    expect(milk.baseAmount).toBe(100);
    expect(milk.canonicalType).toBe('volume');
    const soybean = PRESET_FOOD_MAP.get('soybean')!;
    expect(soybean.proteinPerBase).toBe(35);
  });
});

describe('resolvePresetFood', () => {
  it('baseAmount override 生效', () => {
    const merged = resolvePresetFood(chickenBreast, { baseAmount: 150 });
    expect(merged.baseAmount).toBe(150);
    expect(merged.proteinPerBase).toBe(20);
  });

  it('servingOptions override 整体替换且归 foodOverrides 管理（V1.1 统一来源）', () => {
    const servingOptions = [{ id: 'piece', label: '1块', amountInCanonicalUnit: 150 }];
    const merged = resolvePresetFood(chickenBreast, { servingOptions });
    expect(merged.servingOptions).toEqual(servingOptions);
  });
});

describe('updateRecentFoodIds（FR-012，最多 4）', () => {
  it('新食物置顶', () => {
    expect(updateRecentFoodIds(['a', 'b', 'c'], 'd')).toEqual(['d', 'a', 'b', 'c']);
  });

  it('已有食物去重并置顶', () => {
    expect(updateRecentFoodIds(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it('超过 4 个截断', () => {
    expect(updateRecentFoodIds(['a', 'b', 'c', 'd'], 'e')).toEqual(['e', 'a', 'b', 'c']);
  });

  it('空列表新增', () => {
    expect(updateRecentFoodIds([], 'a')).toEqual(['a']);
  });
});

describe('removeCustomFoodReferences（US5.8 / Edge Cases）', () => {
  const baseState: PersistedStateV1 = {
    schemaVersion: 1,
    weightKg: 60,
    coefficient: 1.5,
    selectedFoods: [
      { foodId: 'custom-protein-bar', amountInCanonicalUnit: 2, inputMode: 'canonical' },
      { foodId: 'chicken-breast', amountInCanonicalUnit: 100, inputMode: 'canonical' },
    ],
    foodOverrides: {},
    customFoods: [customFood],
    recentFoodIds: ['custom-protein-bar', 'chicken-breast'],
  };

  it('删除 custom 时同步清理 selectedFoods 与 recentFoodIds 引用', () => {
    const next = removeCustomFoodReferences(baseState, 'custom-protein-bar');
    expect(next.selectedFoods.map((s) => s.foodId)).toEqual(['chicken-breast']);
    expect(next.recentFoodIds).toEqual(['chicken-breast']);
  });

  it('不存在的 id 不产生副作用', () => {
    const next = removeCustomFoodReferences(baseState, 'nope');
    expect(next.selectedFoods).toHaveLength(2);
    expect(next.recentFoodIds).toHaveLength(2);
  });
});
