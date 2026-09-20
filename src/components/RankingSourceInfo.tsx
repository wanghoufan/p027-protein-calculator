import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';

/**
 * 榜单底部说明区（T095/FR-034/SPEC Acceptance 19-23）：
 * 固定文案以数据核验文档为准（原型 6.3g/个提示与“北豆腐28/扇贝30”演示作废）。
 * 完全离线展示：100g 口径提示、来源、核验日期、范围声明、差异说明。
 */
export function RankingSourceInfo() {
  return (
    <View style={styles.wrap}>
      <View style={styles.eggTip}>
        <Text style={styles.eggTipIcon}>💡</Text>
        <Text style={styles.eggTipText}>排行统一按100g比较；计算器输入单位可能不同。</Text>
      </View>
      <View style={styles.sourceCard}>
        <Text style={styles.sourceTitle}>数据来源与说明</Text>
        <Text style={styles.sourceBody}>
          数据来源：中国疾病预防控制中心营养与健康所《中国食物成分表》查询平台。
        </Text>
        <Text style={styles.sourceBody}>核验：2026-09</Text>
        <Text style={styles.sourceBody}>
          仅比较本应用收录的30种常见食物，不代表《中国食物成分表》全库绝对Top 30。
        </Text>
        <Text style={styles.sourceBody}>不同品种、部位、加工方式和品牌会有差异。</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  eggTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.targetCard,
    borderRadius: radius.control,
    padding: spacing.md,
    gap: spacing.sm,
  },
  eggTipIcon: {
    fontSize: 14,
  },
  eggTipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  sourceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sourceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sourceBody: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
