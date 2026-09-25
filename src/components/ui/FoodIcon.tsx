import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Palette } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

const FOOD_IMAGES: Readonly<Record<string, number>> = {
  'chicken-breast': require('../../../assets/foods/chicken-breast.png'),
  'lean-beef': require('../../../assets/foods/lean-beef.png'),
  'lean-pork': require('../../../assets/foods/lean-pork.png'),
  'whole-egg': require('../../../assets/foods/whole-egg.png'),
  'egg-white': require('../../../assets/foods/egg-white.png'),
  milk: require('../../../assets/foods/milk.png'),
  shrimp: require('../../../assets/foods/shrimp.png'),
  fish: require('../../../assets/foods/fish.png'),
  'north-tofu': require('../../../assets/foods/north-tofu.png'),
  soybean: require('../../../assets/foods/soybean.png'),
  'beef-tenderloin': require('../../../assets/foods/beef-tenderloin.png'),
  'lean-lamb': require('../../../assets/foods/lean-lamb.png'),
  'beef-fore-shank': require('../../../assets/foods/beef-fore-shank.png'),
  'pork-tenderloin': require('../../../assets/foods/pork-tenderloin.png'),
  'beef-hind-shank': require('../../../assets/foods/beef-hind-shank.png'),
  'chicken-leg': require('../../../assets/foods/chicken-leg.png'),
  'duck-breast': require('../../../assets/foods/duck-breast.png'),
  'mandarin-fish': require('../../../assets/foods/mandarin-fish.png'),
  perch: require('../../../assets/foods/perch.png'),
  pomfret: require('../../../assets/foods/pomfret.png'),
  'oriental-prawn': require('../../../assets/foods/oriental-prawn.png'),
  hairtail: require('../../../assets/foods/hairtail.png'),
  carp: require('../../../assets/foods/carp.png'),
  'crucian-carp': require('../../../assets/foods/crucian-carp.png'),
  'sea-shrimp': require('../../../assets/foods/sea-shrimp.png'),
  'grass-carp': require('../../../assets/foods/grass-carp.png'),
  'river-shrimp': require('../../../assets/foods/river-shrimp.png'),
  'fresh-scallop': require('../../../assets/foods/fresh-scallop.png'),
  'tofu-sheet': require('../../../assets/foods/tofu-sheet.png'),
  'dried-tofu': require('../../../assets/foods/dried-tofu.png'),
  edamame: require('../../../assets/foods/edamame.png'),
  'south-tofu': require('../../../assets/foods/south-tofu.png'),
  'quail-egg': require('../../../assets/foods/quail-egg.png'),
  'duck-egg': require('../../../assets/foods/duck-egg.png'),
};

interface FoodIconProps {
  foodId: string;
  foodName: string;
  size?: number;
}

/**
 * 食物缩略图（FR-024 本地资产）：
 * 34 种内置食物使用 style-B 3D 软萌图标；自定义食物无图标，用统一扁平风绿色首字兜底。
 */
export function FoodIcon({ foodId, foodName, size = 40 }: FoodIconProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

function createStyles(colors: Palette) {
  return StyleSheet.create({
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
}
