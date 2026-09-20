import { FoodDefinition, ServingOption } from '../types';

export interface FoodValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * custom food 校验（US5.9 / Edge Cases）：
 * 名称非空；蛋白质含量、基准数量、份量映射必须 >0，否则禁保存。
 * preset override 复用同一数值规则（proteinPerBase/baseAmount/serving >0）。
 */
export function validateCustomFood(
  food: Pick<FoodDefinition, 'name' | 'proteinPerBase' | 'baseAmount'> & {
    servingOptions?: ServingOption[];
  },
): FoodValidationResult {
  const errors: string[] = [];
  if (!food.name || food.name.trim().length === 0) {
    errors.push('名称不能为空');
  }
  if (!(food.proteinPerBase > 0)) {
    errors.push('蛋白质含量必须大于 0');
  }
  if (!(food.baseAmount > 0)) {
    errors.push('基准数量必须大于 0');
  }
  for (const serving of food.servingOptions ?? []) {
    if (!serving.label || serving.label.trim().length === 0) {
      errors.push('份量名称不能为空');
    }
    if (!(serving.amountInCanonicalUnit > 0)) {
      errors.push('份量映射必须大于 0');
    }
  }
  return { valid: errors.length === 0, errors };
}

/** preset override 数值校验（US4：>0 才允许保存）。 */
export function validatePresetOverride(override: {
  proteinPerBase: number;
  baseAmount: number;
  servingOptions?: ServingOption[];
}): FoodValidationResult {
  const errors: string[] = [];
  if (!(override.proteinPerBase > 0)) {
    errors.push('蛋白质含量必须大于 0');
  }
  if (!(override.baseAmount > 0)) {
    errors.push('基准数量必须大于 0');
  }
  for (const serving of override.servingOptions ?? []) {
    if (!(serving.amountInCanonicalUnit > 0)) {
      errors.push('份量映射必须大于 0');
    }
  }
  return { valid: errors.length === 0, errors };
}
