import {
  ProteinGoalLevel,
  ProteinGoalMode,
  ProteinGoalSelection,
  PROTEIN_GOAL_MODES,
} from '../types';

/**
 * V1.5.1 目标域（US8/US9 / SPEC §3-§5）：
 * 系数由 mode+level 冻结表派生，业务 UI 不独立硬编码系数（FR-038）。
 */

/** 取档位系数（8 档完全匹配 SPEC 冻结表）。 */
export function getGoalCoefficient(mode: ProteinGoalMode, level: ProteinGoalLevel): number {
  return PROTEIN_GOAL_MODES[mode][level];
}

/** 系数展示：固定 1 位小数（如 1.0×、1.6×、2.0×），与原型一致。 */
export function formatCoefficient(value: number): string {
  return value.toFixed(1);
}

/** 今日目标：weightKg × coefficient。保留完整精度，不提前 round。 */
export function calculateTargetProtein(
  weightKg: number,
  mode: ProteinGoalMode,
  level: ProteinGoalLevel,
): number {
  return weightKg * getGoalCoefficient(mode, level);
}

export type WeightValidationResult =
  { valid: true; value: number } | { valid: false; reason: 'not_finite' | 'not_positive' };

/**
 * 体重校验（FR-055）：必须 finite 且 >0；
 * NaN/Infinity/负数/0 一律拒绝，无效值不写权威状态。
 */
export function validateWeightKg(input: unknown): WeightValidationResult {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    return { valid: false, reason: 'not_finite' };
  }
  if (input <= 0) {
    return { valid: false, reason: 'not_positive' };
  }
  return { valid: true, value: input };
}

/** proteinGoal 选择完整性守卫：未知 mode/level 视为无效。 */
export function isValidProteinGoalSelection(value: unknown): value is ProteinGoalSelection {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const mode = candidate.mode;
  const level = candidate.level;
  if (typeof mode !== 'string' || !(mode in PROTEIN_GOAL_MODES)) {
    return false;
  }
  return level === 'low' || level === 'high';
}

/** 新安装默认：日常维持 / 高档 / 1.0（SPEC §1）。 */
export const DEFAULT_PROTEIN_GOAL: ProteinGoalSelection = {
  mode: 'daily_maintenance',
  level: 'high',
} as const;
