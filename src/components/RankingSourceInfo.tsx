import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Palette } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../i18n/I18nContext';

/**
 * 榜单底部说明区（T095/FR-034/SPEC Acceptance 19-23）：
 * 固定文案以数据核验文档为准（原型 6.3g/个提示与“北豆腐28/扇贝30”演示作废）。
 * 完全离线展示：100g 口径提示、来源、核验日期、范围声明、差异说明。
 */
export function RankingSourceInfo() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useT();
  return (
    <View style={styles.wrap}>
      <View style={styles.eggTip}>
        <Text style={styles.eggTipIcon}>💡</Text>
        <Text style={styles.eggTipText}>{t.rankingTip}</Text>
      </View>
      <View style={styles.sourceCard}>
        <Text style={styles.sourceTitle}>{t.sourceTitle}</Text>
        <Text style={styles.sourceBody}>
          {t.sourceBody}
        </Text>
        <Text style={styles.sourceBody}>{t.sourceChecked}</Text>
        <Text style={styles.sourceBody}>
          {t.sourceScope}
        </Text>
        <Text style={styles.sourceBody}>{t.sourceVariance}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
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
}
