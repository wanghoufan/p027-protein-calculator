import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProteinRankingCategoryChips } from './ProteinRankingCategoryChips';
import { ProteinRankingRow } from './ProteinRankingRow';
import { RankingSourceInfo } from './RankingSourceInfo';
import { filterProteinRanking } from '../domain/ranking';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { ProteinRankingFilter } from '../types';
import type { Calculator } from '../hooks/useProteinCalculator';
import { useT } from '../i18n/I18nContext';

interface ProteinRankingModalProps {
  visible: boolean;
  onClose: () => void;
  calculator: Calculator;
}

/**
 * 全屏排行榜 Modal（T096-T098/FR-025~033）：
 * - Android Safe Area + 顶部返回 + 系统 Back（Modal onRequestClose）；
 * - 打开默认「全部」，筛选为本地瞬时状态，关闭不持久化（T097）；
 * - 点击 + 加入当前计算：Modal 不关闭、保持滚动/筛选、重复 no-op、按钮变已添加、amount=0（T098）；
 * - FlatList 虚拟化 30 条；过滤后保留全局 rank。
 */
export function ProteinRankingModal({ visible, onClose, calculator }: ProteinRankingModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* key 重挂载：每次打开都是全新状态，天然默认「全部」（SPEC Acceptance 9），避免 effect 里 setState。 */}
      {visible ? (
        <RankingContent key="ranking-open" onClose={onClose} calculator={calculator} />
      ) : null}
    </Modal>
  );
}

function RankingContent({ onClose, calculator }: Omit<ProteinRankingModalProps, 'visible'>) {
  const [filter, setFilter] = useState<ProteinRankingFilter>('all');
  const { t } = useT();

  const rows = useMemo(() => filterProteinRanking(filter), [filter]);
  const addedIds = useMemo(
    () => new Set(calculator.selectedFoods.map((selected) => selected.foodId)),
    [calculator.selectedFoods],
  );

  const handleAdd = (foodId: string) => {
    // addFood 内部：已选中即 no-op（不产生第二行），新行 amountInCanonicalUnit=0，更新 recent。
    calculator.addFood(foodId);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.backHomeA11y}
          style={styles.back}
          onPress={onClose}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerTextCol}>
          <Text style={styles.title}>{t.rankingTitle}</Text>
          <Text style={styles.subtitle}>{t.rankingSubtitle}</Text>
        </View>
      </View>
      <View style={styles.chipsWrap}>
        <ProteinRankingCategoryChips selected={filter} onSelect={setFilter} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(entry) => entry.foodId}
        renderItem={({ item }) => (
          <ProteinRankingRow entry={item} added={addedIds.has(item.foodId)} onAdd={handleAdd} />
        )}
        ItemSeparatorComponent={Separator}
        ListFooterComponent={RankingSourceInfo}
        contentContainerStyle={styles.listContent}
        accessibilityLabel={t.rankingListA11y}
      />
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    ...typography.headerTitle,
    fontSize: 18,
  },
  subtitle: {
    ...typography.tagline,
    marginTop: 1,
  },
  chipsWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  separator: {
    height: spacing.xs,
  },
});
