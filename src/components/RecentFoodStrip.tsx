import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FoodIcon } from './ui/FoodIcon';
import { FoodDefinition, MAX_RECENT_FOODS } from '../types';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { fmt, foodName, useT } from '../i18n/I18nContext';

interface RecentFoodStripProps {
  foods: readonly FoodDefinition[];
  selectedIds: ReadonlySet<string>;
  onToggle: (foodId: string) => void;
}

/**
 * 常用食物快捷区（US3.5/6）：最多 4 项，添加后置顶。
 * 视觉向原型靠拢：四宫格缩略图卡 + 右下角 + 徽标。
 */
export function RecentFoodStrip({ foods, selectedIds, onToggle }: RecentFoodStripProps) {
  const { t, locale } = useT();
  if (foods.length === 0) {
    return null;
  }
  return (
    <View style={styles.grid} accessibilityLabel={t.recentStripA11y}>
      {foods.slice(0, MAX_RECENT_FOODS).map((food) => {
        const selected = selectedIds.has(food.id);
        const displayName = foodName(food, t, locale);
        return (
          <Pressable
            key={food.id}
            accessibilityRole="button"
            accessibilityLabel={fmt(t.recentActionA11y, {
              action: selected ? t.wordRemove : t.wordAdd,
              name: displayName,
            })}
            style={[styles.cell, selected && styles.cellSelected]}
            onPress={() => onToggle(food.id)}
          >
            <FoodIcon foodId={food.id} foodName={displayName} size={44} />
            <Text style={styles.cellText} numberOfLines={1}>
              {/* 透明状态前缀：+ / ✓ 状态由右上角徽标表达，同时避免与分类行食物名精确撞名 */}
              <Text style={styles.cellStatePrefix}>{selected ? '✓ ' : '+ '}</Text>
              {displayName}
            </Text>
            <View style={[styles.badge, selected && styles.badgeSelected]}>
              <Text style={styles.badgeText}>{selected ? '✓' : '+'}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    flexGrow: 1,
    flexBasis: '23%',
    minWidth: 72,
    borderRadius: radius.control,
    backgroundColor: colors.controlBg,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  cellSelected: {
    backgroundColor: colors.primarySoft,
  },
  cellText: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cellStatePrefix: {
    color: 'transparent',
    fontSize: 8,
  },
  badge: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: {
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 14,
    color: colors.surface,
    fontWeight: '700',
  },
});
