import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

const FOOD_IMAGES: Readonly<Record<string, number>> = {
  'chicken-breast': require('../../../assets/foods/chicken-breast.png'),
  'whole-egg': require('../../../assets/foods/whole-egg.png'),
  milk: require('../../../assets/foods/milk.png'),
  'egg-white': require('../../../assets/foods/egg-white.png'),
  'lean-beef': require('../../../assets/foods/lean-beef.png'),
  'lean-pork': require('../../../assets/foods/lean-pork.png'),
  shrimp: require('../../../assets/foods/shrimp.png'),
  fish: require('../../../assets/foods/fish.png'),
};

interface FoodIconProps {
  foodId: string;
  foodName: string;
  size?: number;
}

/**
 * 食物缩略图（FR-024 本地资产）：
 * 有裁剪图的食物用参考图图块；北豆腐/黄豆/自定义食物用统一扁平风绿色首字兜底，保证全套风格一致。
 */
export function FoodIcon({ foodId, foodName, size = 40 }: FoodIconProps) {
  const image = FOOD_IMAGES[foodId];
  if (image) {
    return (
      <Image
        source={image}
        style={{ width: size, height: size, borderRadius: size * 0.26 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size * 0.26 }]}>
      <Text style={[styles.fallbackText, { fontSize: size * 0.42 }]} numberOfLines={1}>
        {foodName.slice(0, 1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
