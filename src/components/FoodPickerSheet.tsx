import React, { useMemo, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RecentFoodStrip } from './RecentFoodStrip';
import { FoodCategorySection } from './FoodCategorySection';
import { FoodIcon } from './ui/FoodIcon';
import { Palette } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { FoodDefinition, PRESET_CATEGORIES } from '../types';
import type { Calculator } from '../hooks/useProteinCalculator';
import { fmt, foodName, unitLabel, useT } from '../i18n/I18nContext';

interface FoodPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  calculator: Calculator;
  onRequestCreateCustom: () => void;
  onRequestEditFood: (food: FoodDefinition) => void;
}

/**
 * 本地 Bottom Sheet 食物选择器（US3 / FR-010/011/012）：
 * 搜索（trim 包含匹配）、常用区、分类折叠、我的食物、+ 自定义食物。
 * 添加成功后 sheet 保持打开可继续添加（US3.10）。
 */
export function FoodPickerSheet({
  visible,
  onClose,
  calculator,
  onRequestCreateCustom,
  onRequestEditFood,
}: FoodPickerSheetProps) {
  const [query, setQuery] = useState('');
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t, locale } = useT();
  const translateY = useMemo(() => new Animated.Value(0), []);

  const selectedIds = useMemo(
    () => new Set(calculator.selectedFoods.map((selected) => selected.foodId)),
    [calculator.selectedFoods],
  );

  // 与旧实现等价：闭包捕获当前 onClose；useMemo 依赖 onClose，回调身份变化时重建。
  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 8 && gesture.vy > 0,
        onPanResponderMove: (_event, gesture) => {
          if (gesture.dy > 0) {
            translateY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > 80) {
            onClose();
          }
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        },
      }).panHandlers,
    [translateY, onClose],
  );

  const toggleFood = (foodId: string) => {
    if (calculator.isFoodSelected(foodId)) {
      calculator.removeFood(foodId);
    } else {
      calculator.addFood(foodId);
    }
  };

  const recentFoods = calculator.recentFoodIds
    .map((id) => calculator.getFoodById(id))
    .filter((food): food is FoodDefinition => Boolean(food));

  const trimmed = query.trim();
  const searchResults = useMemo(() => {
    if (trimmed.length === 0) {
      return [];
    }
    const lowered = trimmed.toLowerCase();
    return calculator.effectiveFoods.filter(
      (food) =>
        food.name.includes(trimmed) ||
        (locale === 'en' &&
          (t.foods[food.id] ?? '').toLowerCase().includes(lowered)),
    );
  }, [trimmed, calculator.effectiveFoods, locale, t]);

  const renderFoodRow = (food: FoodDefinition) => {
    const selected = selectedIds.has(food.id);
    const displayName = foodName(food, t, locale);
    return (
      <View key={food.id} style={styles.foodRow}>
        <FoodIcon foodId={food.id} foodName={displayName} size={36} />
        <View style={styles.foodNameCol}>
          <Text style={styles.foodName}>{displayName}</Text>
          <Text style={styles.foodBase}>
            {food.proteinPerBase}g / {food.baseAmount}
            {unitLabel(food.canonicalUnit, t)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fmt(t.actionA11y, {
            action: selected ? t.wordRemove : t.wordAdd,
            name: displayName,
          })}
          style={[styles.action, selected && styles.actionSelected]}
          onPress={() => toggleFood(food.id)}
        >
          <Text style={[styles.actionText, selected && styles.actionTextSelected]}>
            {selected ? '✓' : '+'}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} accessibilityLabel={t.pickerOverlayA11y} onPress={onClose} />
        <Animated.View
          accessibilityLabel={t.pickerA11y}
          style={[styles.sheet, shadows.sheet, { transform: [{ translateY }] }]}
        >
          <View {...panHandlers}>
            <View style={styles.handleArea}>
              <View style={styles.handle} />
            </View>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{t.pickerTitle}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.pickerCloseA11y}
                hitSlop={12}
                onPress={onClose}
              >
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.search}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              accessibilityLabel={t.searchA11y}
              keyboardType="default"
              returnKeyType="search"
            />
          </View>
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {trimmed.length > 0 ? (
              searchResults.length > 0 ? (
                searchResults.map(renderFoodRow)
              ) : (
                <Text style={styles.empty}>{t.noResults}</Text>
              )
            ) : (
              <>
                <Text style={styles.sectionTitle}>{t.recentSection}</Text>
                <RecentFoodStrip
                  foods={recentFoods}
                  selectedIds={selectedIds}
                  onToggle={toggleFood}
                />
                {PRESET_CATEGORIES.map((category) => (
                  <FoodCategorySection
                    key={category.id}
                    title={t.categories[category.id] ?? category.label}
                    foods={calculator.effectiveFoods.filter(
                      (food) => food.source === 'preset' && food.category === category.id,
                    )}
                    selectedIds={selectedIds}
                    onToggle={toggleFood}
                  />
                ))}
                <View style={[styles.section, styles.customSection]}>
                  <Text style={styles.sectionTitle}>{t.myFoods}</Text>
                  {calculator.customFoods.length === 0 ? (
                    <Text style={styles.customEmpty}>{t.myFoodsEmpty}</Text>
                  ) : (
                    calculator.customFoods.map(renderFoodRow)
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.createCustomA11y}
                    style={styles.createCustom}
                    onPress={onRequestCreateCustom}
                  >
                    <View style={styles.createCustomPlus}>
                      <Text style={styles.createCustomPlusText}>＋</Text>
                    </View>
                    <View style={styles.createCustomTextCol}>
                      <Text style={styles.createCustomText}>{t.createCustom}</Text>
                      <Text style={styles.createCustomHint}>{t.createCustomHint}</Text>
                    </View>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheet: {
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    handleArea: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    close: {
      fontSize: 20,
      color: colors.textSecondary,
      minHeight: 44,
      minWidth: 44,
      textAlign: 'center',
      textAlignVertical: 'center',
      lineHeight: 44,
    },
    searchWrap: {
      marginTop: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 46,
      borderRadius: radius.input,
      backgroundColor: colors.controlBg,
      paddingHorizontal: spacing.md,
    },
    searchIcon: {
      fontSize: 18,
      color: colors.textSecondary,
      marginRight: spacing.sm,
    },
    search: {
      flex: 1,
      minHeight: 46,
      fontSize: 15,
      color: colors.textPrimary,
    },
    scroll: {
      marginTop: spacing.sm,
    },
    scrollContent: {
      paddingBottom: spacing.lg,
    },
    sectionTitle: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    foodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 56,
    },
    foodNameCol: {
      flex: 1,
    },
    foodName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    foodBase: {
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
    empty: {
      marginTop: spacing.xl,
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 14,
    },
    section: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    customSection: {
      marginTop: spacing.lg,
      borderBottomWidth: 0,
    },
    customEmpty: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    createCustom: {
      marginTop: spacing.md,
      minHeight: 64,
      borderRadius: radius.control,
      backgroundColor: colors.primarySoft,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      gap: spacing.md,
    },
    createCustomPlus: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    createCustomPlusText: {
      fontSize: 18,
      lineHeight: 20,
      fontWeight: '700',
      color: colors.surface,
    },
    createCustomTextCol: {
      flex: 1,
    },
    createCustomText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
    createCustomHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
  });
}
