import {
  calculateFoodProtein,
  calculateProteinBalance,
  calculateTargetProtein,
  calculateTotalProtein,
  formatProtein,
} from '../src/domain/protein';
import { PRESET_FOOD_MAP } from '../src/data/presetFoods';
import { FoodDefinition, SelectedFood } from '../src/types';
import { setAmountFromCanonicalInput, setAmountFromServingInput } from '../src/domain/units';
import { resolvePresetFood } from '../src/domain/food';

const chickenBreast = PRESET_FOOD_MAP.get('chicken-breast')!;
const wholeEgg = PRESET_FOOD_MAP.get('whole-egg')!;
const milk = PRESET_FOOD_MAP.get('milk')!;

const selected = (foodId: string, amount: number): SelectedFood => ({
  foodId,
  amountInCanonicalUnit: amount,
  inputMode: 'canonical',
});

describe('calculateTargetProtein（FR-001/002）', () => {
  it('60kg × 1.5 = 90g', () => {
    expect(calculateTargetProtein(60, 1.5)).toBe(90);
  });

  it('60kg × 1.0 = 60g', () => {
    expect(calculateTargetProtein(60, 1.0)).toBe(60);
  });
});

describe('calculateFoodProtein（FR-004）', () => {
  it('300g 鸡胸肉（20g/100g）= 60g', () => {
    expect(calculateFoodProtein(chickenBreast, 300)).toBeCloseTo(60, 10);
  });

  it('2 个全蛋（7g/个）= 14g', () => {
    expect(calculateFoodProtein(wholeEgg, 2)).toBeCloseTo(14, 10);
  });

  it('250ml 牛奶（3g/100ml）= 7.5g', () => {
    expect(calculateFoodProtein(milk, 250)).toBeCloseTo(7.5, 10);
  });
});

describe('calculateTotalProtein（US2 独立测试）', () => {
  it('300g 鸡胸 + 2 蛋 + 250ml 奶 = 81.5g', () => {
    const foods = [chickenBreast, wholeEgg, milk];
    const selectedFoods = [
      selected('chicken-breast', 300),
      selected('whole-egg', 2),
      selected('milk', 250),
    ];
    expect(calculateTotalProtein(foods, selectedFoods)).toBeCloseTo(81.5, 10);
  });

  it('数量为 0 的食物不贡献蛋白质', () => {
    const foods = [chickenBreast];
    expect(calculateTotalProtein(foods, [selected('chicken-breast', 0)])).toBe(0);
  });
});

describe('calculateProteinBalance（FR-017）', () => {
  it('total < target → remaining', () => {
    expect(calculateProteinBalance(90, 81.5)).toEqual({ type: 'remaining', amount: 8.5 });
  });

  it('total > target → over', () => {
    expect(calculateProteinBalance(60, 90)).toEqual({ type: 'over', amount: 30 });
  });

  it('total = target → met', () => {
    expect(calculateProteinBalance(90, 90)).toEqual({ type: 'met', amount: 0 });
  });
});

describe('formatProtein（SPEC 7.4）', () => {
  it('整数省略 .0：90 → "90"', () => {
    expect(formatProtein(90)).toBe('90');
  });

  it('1 位小数：60.5 → "60.5"', () => {
    expect(formatProtein(60.5)).toBe('60.5');
  });

  it('0 → "0"', () => {
    expect(formatProtein(0)).toBe('0');
  });

  it('四舍五入到 1 位：7.55 → "7.6"', () => {
    expect(formatProtein(7.55)).toBe('7.6');
  });
});

describe('canonical/serving 变换（FR-007/008）', () => {
  it('serving 输入映射为 canonical amount：2块鸡胸(100g/块) → 200g → 40g 蛋白质', () => {
    const piece = chickenBreast.servingOptions[0];
    const next = setAmountFromServingInput(selected('chicken-breast', 0), piece, 2);
    expect(next.amountInCanonicalUnit).toBe(200);
    expect(calculateFoodProtein(chickenBreast, next.amountInCanonicalUnit)).toBeCloseTo(40, 10);
  });

  it('1块改 150g 后：1块=30g，2块=60g 蛋白质', () => {
    const overridden = resolvePresetFood(chickenBreast, {
      servingOptions: [{ id: 'piece', label: '1块', amountInCanonicalUnit: 150 }],
    });
    const one = setAmountFromServingInput(
      selected('chicken-breast', 0),
      overridden.servingOptions[0],
      1,
    );
    const two = setAmountFromServingInput(
      selected('chicken-breast', 0),
      overridden.servingOptions[0],
      2,
    );
    expect(calculateFoodProtein(overridden, one.amountInCanonicalUnit)).toBeCloseTo(30, 10);
    expect(calculateFoodProtein(overridden, two.amountInCanonicalUnit)).toBeCloseTo(60, 10);
  });

  it('canonical → serving 切换保持 canonical amount 与蛋白质不变（SC-004）', () => {
    const piece = chickenBreast.servingOptions[0];
    const start = selected('chicken-breast', 300);
    const switched = setAmountFromServingInput(start, piece, 3);
    expect(switched.amountInCanonicalUnit).toBe(300);
    expect(calculateFoodProtein(chickenBreast, switched.amountInCanonicalUnit)).toBeCloseTo(
      calculateFoodProtein(chickenBreast, start.amountInCanonicalUnit),
      10,
    );
  });

  it('serving → canonical 输入不改变实际量：3块(100g) 输入 canonical 300 → 蛋白质仍 60', () => {
    const piece = chickenBreast.servingOptions[0];
    const servingMode = setAmountFromServingInput(selected('chicken-breast', 300), piece, 3);
    const back = setAmountFromCanonicalInput(servingMode, 300);
    expect(back.amountInCanonicalUnit).toBe(300);
    expect(back.inputMode).toBe('canonical');
    expect(calculateFoodProtein(chickenBreast, back.amountInCanonicalUnit)).toBeCloseTo(60, 10);
  });
});

describe('FR-006 禁止 g↔ml 自动换算', () => {
  it('VOLUME 食物 canonical 输入直接按 ml 参与计算，不发生密度换算', () => {
    // 250ml 牛奶 = 7.5g 蛋白质；若被换算为 g 基准（3g/100g）则为 7.5g 纯巧合不成立，
    // 用 100ml 断言：100ml → 3g 蛋白质（若按 g 换算会得到 3g/100g×100=3，数值相同不具区分度；
    // 因此用 250ml：ml 语义 = 7.5，任何 g↔ml 双向换算都会破坏 ml 基准）。
    const next = setAmountFromCanonicalInput(selected('milk', 0), 250);
    expect(next.amountInCanonicalUnit).toBe(250);
    expect(calculateFoodProtein(milk, next.amountInCanonicalUnit)).toBeCloseTo(7.5, 10);
  });

  it('VOLUME 食物 serving（1瓶=250ml）映射后 canonical amount 仍为 ml 数值 250', () => {
    const bottle = milk.servingOptions[0];
    const next = setAmountFromServingInput(selected('milk', 0), bottle, 1);
    expect(next.amountInCanonicalUnit).toBe(250);
    expect(next.servingId).toBe('bottle');
  });

  it('display quantity 切换模式不改数量：milk canonical 250 ↔ serving 1瓶 均显示一致实际量', () => {
    const bottle = milk.servingOptions[0];
    const canonicalMode = selected('milk', 250);
    const servingMode = setAmountFromServingInput(canonicalMode, bottle, 1);
    expect(servingMode.amountInCanonicalUnit).toBe(canonicalMode.amountInCanonicalUnit);
  });
});

describe('输入步长（SPEC 7.3）', () => {
  it('MASS canonical 步长 50g', () => {
    expect(
      chickenBreast.canonicalType === 'mass' &&
        require('../src/domain/units').getCanonicalStep(chickenBreast.canonicalType),
    ).toBe(50);
  });

  it('VOLUME canonical 步长 50ml', () => {
    expect(require('../src/domain/units').getCanonicalStep(milk.canonicalType)).toBe(50);
  });

  it('COUNT canonical 步长 1', () => {
    expect(require('../src/domain/units').getCanonicalStep(wholeEgg.canonicalType)).toBe(1);
  });
});

describe('负值与 clamp（US2.7）', () => {
  it('canonical 输入负值被钳制为 0', () => {
    const next = setAmountFromCanonicalInput(selected('chicken-breast', 100), -5);
    expect(next.amountInCanonicalUnit).toBe(0);
  });
});

describe('resolvePresetFood（FR-013）', () => {
  it('override 覆盖 proteinPerBase：鸡胸 20 → 23.6，300g = 70.8g', () => {
    const merged = resolvePresetFood(chickenBreast, { proteinPerBase: 23.6 });
    expect(merged.proteinPerBase).toBe(23.6);
    expect(merged.baseAmount).toBe(100);
    expect(calculateFoodProtein(merged, 300)).toBeCloseTo(70.8, 10);
  });

  it('无 override 时返回原始 preset', () => {
    expect(resolvePresetFood(chickenBreast, undefined)).toEqual(chickenBreast);
  });

  it('override 不得修改 id/source/category/canonical type/unit', () => {
    const merged = resolvePresetFood(chickenBreast, { proteinPerBase: 25 });
    expect(merged.id).toBe('chicken-breast');
    expect(merged.source).toBe('preset');
    expect(merged.canonicalType).toBe('mass');
    expect(merged.canonicalUnit).toBe('g');
  });
});

describe('FoodDefinition 类型使用（编译保障）', () => {
  it('food 定义满足 FoodDefinition', () => {
    const food: FoodDefinition = chickenBreast;
    expect(food.name).toBe('鸡胸肉');
  });
});
