import {
  calculateTargetProtein,
  getGoalCoefficient,
  validateWeightKg,
  isValidProteinGoalSelection,
  DEFAULT_PROTEIN_GOAL,
} from '../src/domain/proteinGoal';
import { PROTEIN_GOAL_MODES, PROTEIN_GOAL_MODE_IDS } from '../src/types';

describe('PROTEIN_GOAL_MODES 冻结表（SC-020）', () => {
  it('四模式 8 档与 SPEC §3 完全一致', () => {
    expect(PROTEIN_GOAL_MODES).toEqual({
      daily_maintenance: { low: 0.8, high: 1.0 },
      fitness_maintenance: { low: 1.2, high: 1.6 },
      muscle_gain: { low: 1.6, high: 2.0 },
      fat_loss_muscle_retention: { low: 1.6, high: 2.4 },
    });
    expect(PROTEIN_GOAL_MODE_IDS).toHaveLength(4);
  });
});

describe('getGoalCoefficient（FR-038）', () => {
  it('8 档取值正确', () => {
    expect(getGoalCoefficient('daily_maintenance', 'low')).toBe(0.8);
    expect(getGoalCoefficient('daily_maintenance', 'high')).toBe(1.0);
    expect(getGoalCoefficient('fitness_maintenance', 'low')).toBe(1.2);
    expect(getGoalCoefficient('fitness_maintenance', 'high')).toBe(1.6);
    expect(getGoalCoefficient('muscle_gain', 'low')).toBe(1.6);
    expect(getGoalCoefficient('muscle_gain', 'high')).toBe(2.0);
    expect(getGoalCoefficient('fat_loss_muscle_retention', 'low')).toBe(1.6);
    expect(getGoalCoefficient('fat_loss_muscle_retention', 'high')).toBe(2.4);
  });
});

describe('calculateTargetProtein（US8）', () => {
  it('weight × coefficient，保留完整精度', () => {
    expect(calculateTargetProtein(68, 'muscle_gain', 'low')).toBeCloseTo(108.8);
    expect(calculateTargetProtein(60, 'daily_maintenance', 'high')).toBe(60);
    expect(calculateTargetProtein(70.5, 'fat_loss_muscle_retention', 'high')).toBeCloseTo(169.2);
  });

  it('模式/档位变化即时重算（SC-021：只改目标）', () => {
    const base = calculateTargetProtein(68, 'daily_maintenance', 'high');
    const next = calculateTargetProtein(68, 'fitness_maintenance', 'high');
    expect(next).toBeCloseTo(108.8);
    expect(next).not.toBe(base);
  });
});

describe('validateWeightKg（FR-055）', () => {
  it('拒绝 NaN / Infinity / 负数 / 0', () => {
    expect(validateWeightKg(NaN).valid).toBe(false);
    expect(validateWeightKg(Infinity).valid).toBe(false);
    expect(validateWeightKg(-Infinity).valid).toBe(false);
    expect(validateWeightKg(-1).valid).toBe(false);
    expect(validateWeightKg(0).valid).toBe(false);
    expect(validateWeightKg('68' as unknown as number).valid).toBe(false);
  });

  it('接受正 finite 数', () => {
    expect(validateWeightKg(68)).toEqual({ valid: true, value: 68 });
    expect(validateWeightKg(0.5)).toEqual({ valid: true, value: 0.5 });
  });
});

describe('isValidProteinGoalSelection', () => {
  it('合法四模式选择通过', () => {
    expect(isValidProteinGoalSelection({ mode: 'daily_maintenance', level: 'high' })).toBe(true);
  });

  it('未知 mode/level 拒绝', () => {
    expect(isValidProteinGoalSelection({ mode: 'unknown', level: 'high' })).toBe(false);
    expect(isValidProteinGoalSelection({ mode: 'muscle_gain', level: 'mid' })).toBe(false);
    expect(isValidProteinGoalSelection(null)).toBe(false);
    expect(isValidProteinGoalSelection(undefined)).toBe(false);
  });
});

describe('新安装默认（SPEC §1）', () => {
  it('默认 日常维持/高档/1.0', () => {
    expect(DEFAULT_PROTEIN_GOAL).toEqual({ mode: 'daily_maintenance', level: 'high' });
    expect(getGoalCoefficient(DEFAULT_PROTEIN_GOAL.mode, DEFAULT_PROTEIN_GOAL.level)).toBe(1.0);
  });
});
