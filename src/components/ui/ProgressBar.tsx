import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';

interface ProgressBarProps {
  /** 0~1；超过 1 视觉封顶 100%（US2.10），数值显示由调用方负责。 */
  progress: number;
  accessibilityLabel?: string;
}

/** 进度条：超过目标时视觉封顶 100%。 */
export function ProgressBar({ progress, accessibilityLabel }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      // 0..100，供无障碍读取真实进度
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: radius.control / 2,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.control / 2,
    backgroundColor: colors.primary,
  },
});
