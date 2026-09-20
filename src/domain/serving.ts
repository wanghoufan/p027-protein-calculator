import { ServingOption } from '../types';

/**
 * V1.5.1 Legacy serving 清理 manifest（T132 / SPEC §7 / Principle VIII）。
 *
 * 生成方式：基于真实 repo 静态盘点（T130/T132）——
 * - V1.1 既有 4 条 system serving（chicken-breast/piece=100g、whole-egg/piece=1个、
 *   egg-white/piece=1个、milk/bottle=250ml）为用户依赖的合法基础份量，全部保留；
 * - V1.4 新增 24 种 Top30 食物 servingOptions 均为空数组，从未生成过 system serving；
 * - 旧 schema 未持久化 origin，无法证明某条历史 serving 是“错误的系统默认”。
 *
 * 结论：可证实的错误系统默认集合为空（预计空集）。来源不明的历史 serving 一律
 * 保留并归入用户侧语义（迁移时归化 origin，绝不批量删除）。
 */
export const LEGACY_INVALID_SYSTEM_SERVING: readonly {
  foodId: string;
  servingId: string;
  reason: string;
}[] = [];

/**
 * serving origin 归一化（迁移用，deterministic）：
 * - 已带合法 origin 的条目原样保留；
 * - 缺失 origin（V1 数据）时：id 命中该 preset 食物基础 serving → SYSTEM_DEFAULT；
 *   其余来源不明 → 保留为 USER_DEFINED（Principle VIII：不误删用户数据）。
 */
export function normalizeServingOrigin(
  serving: ServingOption,
  baseServingIds: readonly string[],
): ServingOption {
  if (serving.origin === 'SYSTEM_DEFAULT' || serving.origin === 'USER_DEFINED') {
    return serving;
  }
  const origin = baseServingIds.includes(serving.id) ? 'SYSTEM_DEFAULT' : 'USER_DEFINED';
  return { ...serving, origin };
}

/**
 * system serving override 派生状态（SPEC §6 / Principle VI）：
 * SYSTEM_DEFAULT serving 被用户编辑时 origin 保持 SYSTEM_DEFAULT，
 * 是否被覆盖由本函数与原始系统值比较派生（id/origin 不参与比较）；
 * 恢复默认 = 删除 override，派生回 false。
 */
export function getServingOverrideState(
  base: ServingOption,
  override: ServingOption,
): { isOverridden: boolean } {
  return {
    isOverridden:
      base.label !== override.label ||
      base.amountInCanonicalUnit !== override.amountInCanonicalUnit,
  };
}

/** 校验 serving 输入（FR-045/FR-055）：label trim 后非空、amount finite 且 >0。 */
export function validateServingInput(
  label: string,
  amountInCanonicalUnit: number,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!label || label.trim().length === 0) {
    errors.push('份量名称不能为空');
  }
  if (!Number.isFinite(amountInCanonicalUnit) || amountInCanonicalUnit <= 0) {
    errors.push('份量映射必须大于 0');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * canUseServingMode（T134 / FR-044）：无有效 serving 时 UI 不得进入 serving mode。
 * g↔ml 换算在本模块不存在：serving amount 语义永远跟随食物 canonical unit。
 */
export function canUseServingMode(food: { servingOptions: readonly ServingOption[] }): boolean {
  return food.servingOptions.length > 0;
}
