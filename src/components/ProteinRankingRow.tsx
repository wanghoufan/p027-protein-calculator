import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FoodIcon } from './ui/FoodIcon';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { ProteinRankingEntry, RANKING_FILTERS } from '../types';
import { fmt, rankingName, useT } from '../i18n/I18nContext';

interface ProteinRankingRowProps {
  entry: ProteinRankingEntry;
  added: boolean;
  onAdd: (foodId: string) => void;
}

const TOP_BADGE_COLORS: Record<number, string> = {
  1: '#E8A93D', // 浅金
  2: '#A8B0B8', // 浅银
  3: '#C08552', // 浅铜
};

/**
 * 排行榜行（T094/SPEC Acceptance 7/8）：
 * 全局 rank | 图标（本地 fallback，禁远程） | 名称+分类 | x.xg/100g | +/已添加。
 * 第 1~3 名仅 rank 徽章轻强调；触控≥44dp；已添加为稳定状态。
 */
export function ProteinRankingRow({ entry, added, onAdd }: ProteinRankingRowProps) {
  const { t, locale } = useT();
  const displayName = rankingName(entry, t, locale);
  const categoryText =
    t.rankingFilters[entry.category] ??
    RANKING_FILTERS.find((filter) => filter.id === entry.category)?.label ??
    entry.category;
  const badgeColor = TOP_BADGE_COLORS[entry.rank];
  return (
    <View style={[styles.row, badgeColor ? styles.rowTop : null]}>
      <View style={[styles.rankBadge, badgeColor ? { backgroundColor: `${badgeColor}26` } : null]}>
        <Text style={[styles.rankText, badgeColor ? { color: badgeColor } : null]}>
          {entry.rank}
        </Text>
      </View>
      <FoodIcon foodId={entry.foodId} foodName={displayName} size={40} />
      <View style={styles.nameCol}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.category}>{categoryText}</Text>
      </View>
      <View style={styles.valueCol}>
        <Text style={styles.value}>{entry.officialProteinPer100g.toFixed(1)} g</Text>
        <Text style={styles.basis}>/100g</Text>
      </View>
      {added ? (
        <View
          accessibilityLabel={fmt(t.addedA11y, { name: displayName })}
          style={[styles.action, styles.actionAdded]}
        >
          <Text style={styles.actionAddedText}>{t.added}</Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fmt(t.addA11y, { name: displayName })}
          style={styles.action}
          onPress={() => onAdd(entry.foodId)}
        >
          <Text style={styles.actionText}>＋</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.control,
  },
  rowTop: {
    backgroundColor: '#FBF7EE',
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.controlBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  nameCol: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  category: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  valueCol: {
    alignItems: 'flex-end',
    minWidth: 62,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  basis: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  action: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.surface,
  },
  actionAdded: {
    backgroundColor: colors.primarySoft,
  },
  actionAddedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
