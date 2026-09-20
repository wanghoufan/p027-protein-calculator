import { PROTEIN_RANKING } from '../data/proteinRanking';
import { ProteinRankingEntry, ProteinRankingFilter } from '../types';

/**
 * V1.4 排行榜纯函数（PLAN §3）：
 * 数据真相只在 src/data/proteinRanking.ts；本模块只做排序快照读取与本地过滤。
 */

/**
 * 完整榜单（已按 officialProteinPer100g DESC + tieBreakOrder ASC 排序，rank 固定 1..30）。
 */
export function getSortedProteinRanking(): readonly ProteinRankingEntry[] {
  return PROTEIN_RANKING;
}

/**
 * 分类过滤（FR-029）：纯本地、保留原全局 rank、不重新编号。
 * 'all' 返回完整 30 条。
 */
export function filterProteinRanking(filter: ProteinRankingFilter): readonly ProteinRankingEntry[] {
  if (filter === 'all') {
    return PROTEIN_RANKING;
  }
  return PROTEIN_RANKING.filter((entry) => entry.category === filter);
}
