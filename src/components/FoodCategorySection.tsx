import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FoodIcon } from './ui/FoodIcon';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { FoodDefinition } from '../types';

interface FoodCategorySectionProps {
  title: string;
  foods: readonly FoodDefinition[];
  selectedIds: ReadonlySet<string>;
  onToggle: (foodId: string) => void;
}

/** preset 分类折叠区（US3.8 / T039/T040）：默认折叠，点标题展开/收起。视觉带缩略图行与圆形 + 按钮。 */
export function FoodCategorySection({
  title,
  foods,
  selectedIds,
  onToggle,
}: FoodCategorySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const headerFood = foods[0];
  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={styles.header}
        onPress={() => setExpanded((value) => !value)}
      >
        {headerFood ? (
          <FoodIcon foodId={headerFood.id} foodName={headerFood.name} size={28} />
        ) : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{foods.length} 种</Text>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>
      {expanded
        ? foods.map((food) => {
            const selected = selectedIds.has(food.id);
            return (
              <View key={food.id} style={styles.row}>
                <FoodIcon foodId={food.id} foodName={food.name} size={36} />
                <View style={styles.nameCol}>
                  <Text style={styles.name}>{food.name}</Text>
                  <Text style={styles.base}>
                    {food.proteinPerBase}g / {food.baseAmount}
                    {food.canonicalUnit}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${selected ? '移除' : '添加'} ${food.name}`}
                  style={[styles.action, selected && styles.actionSelected]}
                  onPress={() => onToggle(food.id)}
                >
                  <Text style={[styles.actionText, selected && styles.actionTextSelected]}>
                    {selected ? '✓' : '+'}
                  </Text>
                </Pressable>
              </View>
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  count: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingVertical: spacing.xs,
  },
  nameCol: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  base: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  action: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSelected: {
    backgroundColor: colors.primarySoft,
  },
  actionText: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.surface,
  },
  actionTextSelected: {
    color: colors.primary,
  },
});
