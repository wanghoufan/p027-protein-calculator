import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { ProteinRankingFilter, RANKING_FILTERS } from '../types';

interface ProteinRankingCategoryChipsProps {
  selected: ProteinRankingFilter;
  onSelect: (filter: ProteinRankingFilter) => void;
}

/**
 * 分类 Chip（T093/FR-029/SPEC Acceptance 9）：全部/肉禽/水产/蛋类/豆类。
 * 纯本地即时过滤、不持久化；Chip 名以 SPEC 为准（原型“肉类/蛋奶/豆制品”作废）。
 */
export function ProteinRankingCategoryChips({
  selected,
  onSelect,
}: ProteinRankingCategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel="排行榜分类筛选"
    >
      {RANKING_FILTERS.map((filter) => {
        const active = filter.id === selected;
        return (
          <Pressable
            key={filter.id}
            accessibilityRole="button"
            accessibilityLabel={`分类 ${filter.label}`}
            accessibilityState={{ selected: active }}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(filter.id)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.controlBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.surface,
  },
});
