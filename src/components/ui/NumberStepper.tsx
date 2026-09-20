import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';

interface NumberStepperProps {
  value: number;
  step: number;
  onChange: (value: number) => void;
  accessibilityLabel?: string;
  /** 直接输入允许的最大小数位，默认 1；0 表示整数。 */
  maxDecimals?: number;
  /** large：体重等大数字场景（无边框输入+大字号）；default：食物行等紧凑场景。 */
  variant?: 'default' | 'large';
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * 统一数字步进器（T017b）：
 * `- / +` 按指定 step 调整，0 下限；数字可直接输入；展示最多 1 位小数。
 */
export function NumberStepper({
  value,
  step,
  onChange,
  accessibilityLabel,
  maxDecimals = 1,
  variant = 'default',
}: NumberStepperProps) {
  const [text, setText] = useState(() => formatValue(value, maxDecimals));
  const large = variant === 'large';

  // 外部值变化（如切换模式、清空）时同步输入框：渲染期调整派生状态（React 推荐模式，免 effect）。
  const [sync, setSync] = useState({ value, maxDecimals });
  if (sync.value !== value || sync.maxDecimals !== maxDecimals) {
    const parsed = parseFloat(text);
    const matchesDisplay =
      Number.isFinite(parsed) && roundTo(parsed, maxDecimals) === roundTo(value, maxDecimals);
    setSync({ value, maxDecimals });
    if (!matchesDisplay) {
      setText(formatValue(value, maxDecimals));
    }
  }

  const commit = (raw: string) => {
    const parsed = parseFloat(raw.replace(',', '.'));
    const next = Number.isFinite(parsed) ? Math.max(0, roundTo(parsed, maxDecimals)) : 0;
    onChange(next);
    setText(formatValue(next, maxDecimals));
  };

  const adjust = (direction: 1 | -1) => {
    const next = Math.max(0, roundTo(value + direction * step, maxDecimals));
    onChange(next);
    setText(formatValue(next, maxDecimals));
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel ?? '数值'}减少`}
        style={[styles.button, large && styles.buttonLarge]}
        onPress={() => adjust(-1)}
      >
        <Text style={[styles.buttonText, large && styles.buttonTextLarge]}>−</Text>
      </Pressable>
      <TextInput
        style={[styles.input, large && styles.inputLarge]}
        value={text}
        keyboardType="decimal-pad"
        onChangeText={setText}
        onSubmitEditing={(event) => commit(event.nativeEvent.text)}
        onBlur={() => commit(text)}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="adjustable"
        textAlign="center"
        selectTextOnFocus
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel ?? '数值'}增加`}
        style={[styles.button, large && styles.buttonLarge]}
        onPress={() => adjust(1)}
      >
        <Text style={[styles.buttonText, large && styles.buttonTextLarge]}>＋</Text>
      </Pressable>
    </View>
  );
}

function formatValue(value: number, maxDecimals: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const rounded = roundTo(value, maxDecimals);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(maxDecimals);
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.controlBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.controlBg,
  },
  buttonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '700',
    lineHeight: 24,
  },
  buttonTextLarge: {
    fontSize: 24,
    lineHeight: 28,
  },
  input: {
    flex: 1,
    minWidth: 64,
    marginHorizontal: 6,
    minHeight: 44,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  inputLarge: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontSize: 44,
    fontWeight: '800',
    minHeight: 52,
    paddingVertical: 0,
  },
});
