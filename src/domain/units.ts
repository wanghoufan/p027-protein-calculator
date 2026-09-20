import { CanonicalType, InputMode, ServingOption, SelectedFood } from '../types';

/**
 * canonical 输入默认步长（SPEC 7.3）：
 * MASS 50g、VOLUME 50ml、COUNT 1。serving 模式步长固定 1 份。
 */
export function getCanonicalStep(canonicalType: CanonicalType): number {
  switch (canonicalType) {
    case 'mass':
      return 50;
    case 'volume':
      return 50;
    case 'count':
      return 1;
  }
}

export const SERVING_STEP = 1;

function clampAmount(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

/**
 * canonical 直接输入：写入唯一真相 amountInCanonicalUnit（FR-004）。
 * 本模块不存在任何 g↔ml 换算路径（FR-006）：数值原样保存，单位语义跟随食物 canonical type。
 */
export function setAmountFromCanonicalInput(current: SelectedFood, value: number): SelectedFood {
  return {
    ...current,
    amountInCanonicalUnit: clampAmount(value),
    inputMode: 'canonical',
    servingId: undefined,
  };
}

/**
 * serving 快捷输入：servingCount × serving.amountInCanonicalUnit 映射为 canonical amount（FR-007）。
 * 切换模式只改展示/输入方式，不改实际 canonical amount（FR-008）。
 */
export function setAmountFromServingInput(
  current: SelectedFood,
  serving: ServingOption,
  servingCount: number,
): SelectedFood {
  const count = Number.isFinite(servingCount) && servingCount > 0 ? servingCount : 0;
  return {
    ...current,
    amountInCanonicalUnit: clampAmount(count * serving.amountInCanonicalUnit),
    inputMode: 'serving',
    servingId: serving.id,
  };
}

/**
 * 展示数量：canonical 模式显示 canonical amount；
 * serving 模式显示份数（amount ÷ serving.amountInCanonicalUnit）。
 * 展示值不参与计算，计算永远使用 amountInCanonicalUnit。
 */
export function getDisplayQuantity(selected: SelectedFood, serving?: ServingOption): number {
  if (selected.inputMode === 'serving' && serving && serving.amountInCanonicalUnit > 0) {
    return selected.amountInCanonicalUnit / serving.amountInCanonicalUnit;
  }
  return selected.amountInCanonicalUnit;
}

export function getInputModeLabel(mode: InputMode): string {
  return mode === 'serving' ? '份量' : '克/ml/个';
}
