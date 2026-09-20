import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import {
  CanonicalType,
  COUNT_UNITS,
  FoodDefinition,
  PresetFoodOverride,
  ServingOption,
} from '../types';
import { PRESET_FOOD_MAP } from '../data/presetFoods';
import { getServingOverrideState } from '../domain/serving';
import type { CustomFoodDraft } from '../hooks/useProteinCalculator';

export type EditorMode =
  | { kind: 'preset'; food: FoodDefinition }
  | { kind: 'custom-create' }
  | { kind: 'custom-edit'; food: FoodDefinition };

interface FoodEditorModalProps {
  state: EditorMode | null;
  onClose: () => void;
  onSavePresetOverride: (
    foodId: string,
    override: PresetFoodOverride,
  ) => { ok: boolean; errors: string[] };
  onResetPresetOverride: (foodId: string) => void;
  hasPresetOverride: (foodId: string) => boolean;
  onSaveCustom: (draft: CustomFoodDraft) => { ok: boolean; errors: string[] };
  onUpdateCustom: (foodId: string, draft: CustomFoodDraft) => { ok: boolean; errors: string[] };
  onDeleteCustom: (foodId: string) => void;
}

const CANONICAL_TYPE_OPTIONS: readonly { value: CanonicalType; label: string }[] = [
  { value: 'mass', label: '重量 (g)' },
  { value: 'volume', label: '容量 (ml)' },
  { value: 'count', label: '计数' },
];

type ServingDraft = ServingOption;

/**
 * 食物编辑器（US4/US5）：
 * - preset：只开放 proteinPerBase/baseAmount/servingOptions，canonical type/unit 固定；
 * - custom：完整 FoodDefinition 编辑 + 校验（名称非空、protein/base/serving >0）；
 * - preset 显示"默认值仅作估算"提示与"恢复默认"。
 * 外壳组件负责会话 key：state 变化时以新 key 重挂载表单（免 effect 重置）。
 */
export function FoodEditorModal(props: FoodEditorModalProps) {
  const [session, setSession] = useState(0);
  const [lastState, setLastState] = useState(props.state);
  if (props.state !== lastState) {
    setLastState(props.state);
    if (props.state) {
      setSession((prev) => prev + 1);
    }
  }
  if (!props.state) {
    return null;
  }
  return <FoodEditorForm key={session} {...props} state={props.state} />;
}

interface FoodEditorFormProps extends Omit<FoodEditorModalProps, 'state'> {
  state: EditorMode;
}

function FoodEditorForm({
  state,
  onClose,
  onSavePresetOverride,
  onResetPresetOverride,
  hasPresetOverride,
  onSaveCustom,
  onUpdateCustom,
  onDeleteCustom,
}: FoodEditorFormProps) {
  // preset 字段（每次会话由 state 直接初始化，无需 effect 重置）
  const isCreate = state.kind === 'custom-create';
  const initialFood = isCreate ? null : state.food;
  const [proteinPerBase, setProteinPerBase] = useState(
    isCreate ? '' : String(initialFood!.proteinPerBase),
  );
  const [baseAmount, setBaseAmount] = useState(isCreate ? '' : String(initialFood!.baseAmount));
  const [servings, setServings] = useState<ServingDraft[]>(
    isCreate ? [] : initialFood!.servingOptions.map((option) => ({ ...option })),
  );
  const [name, setName] = useState(state.kind === 'custom-edit' ? state.food.name : '');
  const [canonicalType, setCanonicalType] = useState<CanonicalType>(
    state.kind === 'custom-edit' ? state.food.canonicalType : 'mass',
  );
  const [countUnit, setCountUnit] = useState<string>(
    state.kind === 'custom-edit' && state.food.canonicalType === 'count'
      ? String(state.food.canonicalUnit)
      : '个',
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const mode = state.kind;

  const isPreset = mode === 'preset';
  const isCustomCreate = mode === 'custom-create';
  const isCustomEdit = mode === 'custom-edit';
  const food = state.kind === 'preset' || state.kind === 'custom-edit' ? state.food : null;
  const unit = food
    ? food.canonicalUnit
    : canonicalType === 'volume'
      ? 'ml'
      : canonicalType === 'count'
        ? (countUnit as never)
        : 'g';
  const title = isPreset
    ? `编辑 ${food!.name}`
    : isCustomCreate
      ? '新建自定义食物'
      : `编辑 ${food!.name}`;

  const buildServings = (): ServingOption[] =>
    servings
      .filter((option) => option.label.trim().length > 0 && option.amountInCanonicalUnit > 0)
      .map((option) => ({
        id: option.id,
        label: option.label.trim(),
        amountInCanonicalUnit: option.amountInCanonicalUnit,
        // origin 保持不变（系统默认被编辑仍为 SYSTEM_DEFAULT）；新增行一律 USER_DEFINED。
        origin: option.origin ?? 'USER_DEFINED',
      }));

  const handleSavePreset = () => {
    if (!food) return;
    const protein = parseFloat(proteinPerBase.replace(',', '.'));
    const base = parseFloat(baseAmount.replace(',', '.'));
    const result = onSavePresetOverride(food.id, {
      proteinPerBase: protein,
      baseAmount: base,
      servingOptions: buildServings(),
    });
    if (result.ok) {
      onClose();
    } else {
      setErrors(result.errors);
    }
  };

  const handleSaveCustom = () => {
    const protein = parseFloat(proteinPerBase.replace(',', '.'));
    const base = parseFloat(baseAmount.replace(',', '.'));
    const draft: CustomFoodDraft = {
      name: name.trim() ? name : '',
      canonicalType,
      canonicalUnit:
        canonicalType === 'mass' ? 'g' : canonicalType === 'volume' ? 'ml' : (countUnit as never),
      proteinPerBase: Number.isFinite(protein) ? protein : 0,
      baseAmount: Number.isFinite(base) ? base : 0,
      servingOptions: buildServings(),
    };
    const result =
      state.kind === 'custom-edit' ? onUpdateCustom(state.food.id, draft) : onSaveCustom(draft);
    if (result.ok) {
      onClose();
    } else {
      setErrors(result.errors);
    }
  };

  const updateServing = (index: number, patch: Partial<ServingDraft>) => {
    setServings((prev) =>
      prev.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    );
  };

  // system serving override 派生显示（SPEC §6）：与原始系统值比较，被编辑过标"已修改"。
  const getSystemServingOverridden = (option: ServingDraft): boolean => {
    if (option.origin !== 'SYSTEM_DEFAULT' || state.kind !== 'preset') {
      return false;
    }
    const base = PRESET_FOOD_MAP.get(food!.id)?.servingOptions.find((s) => s.id === option.id);
    return base ? getServingOverrideState(base, option).isOverridden : false;
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="编辑器遮罩" />
        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          bounces={false}
          accessibilityLabel="自定义食物编辑器"
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="关闭编辑器"
              hitSlop={12}
              onPress={onClose}
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {!isPreset ? (
            <>
              <Text style={styles.fieldLabel}>名称</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="例如：蛋白棒"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="食物名称"
              />
            </>
          ) : null}

          {!isPreset ? (
            <>
              <Text style={styles.fieldLabel}>数量类型</Text>
              <View style={styles.optionRow}>
                {CANONICAL_TYPE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: canonicalType === option.value }}
                    accessibilityLabel={`数量类型 ${option.label}`}
                    style={[styles.option, canonicalType === option.value && styles.optionSelected]}
                    onPress={() => setCanonicalType(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        canonicalType === option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {canonicalType === 'count' ? (
                <>
                  <Text style={styles.fieldLabel}>计数单位</Text>
                  <View style={styles.optionRow}>
                    {COUNT_UNITS.map((unit) => (
                      <Pressable
                        key={unit}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: countUnit === unit }}
                        accessibilityLabel={`计数单位 ${unit}`}
                        style={[styles.optionSmall, countUnit === unit && styles.optionSelected]}
                        onPress={() => setCountUnit(unit)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            countUnit === unit && styles.optionTextSelected,
                          ]}
                        >
                          {unit}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
            </>
          ) : (
            <Text style={styles.hint}>
              数量类型固定为 {food!.canonicalUnit}（{food!.canonicalType}），不可修改。
            </Text>
          )}

          <Text style={styles.fieldLabel}>蛋白质含量（g / 基准数量）</Text>
          <TextInput
            style={styles.input}
            value={proteinPerBase}
            onChangeText={setProteinPerBase}
            keyboardType="decimal-pad"
            accessibilityLabel="蛋白质含量"
          />

          <Text style={styles.fieldLabel}>基准数量（{unit}）</Text>
          <TextInput
            style={styles.input}
            value={baseAmount}
            onChangeText={setBaseAmount}
            keyboardType="decimal-pad"
            accessibilityLabel="基准数量"
            editable={!isPreset || true}
          />

          {canonicalType !== 'count' || isPreset ? (
            <>
              <Text style={styles.fieldLabel}>常用份量（可选）</Text>
              {servings.map((option, index) => {
                const overridden = getSystemServingOverridden(option);
                return (
                  <View key={option.id} style={styles.servingRow}>
                    <View style={styles.servingOriginBadge}>
                      <Text
                        style={
                          overridden
                            ? styles.servingOriginOverridden
                            : option.origin === 'SYSTEM_DEFAULT'
                              ? styles.servingOriginSystem
                              : styles.servingOriginUser
                        }
                      >
                        {overridden
                          ? '已修改'
                          : option.origin === 'SYSTEM_DEFAULT'
                            ? '系统'
                            : '自定义'}
                      </Text>
                    </View>
                    <TextInput
                      style={[styles.input, styles.servingLabelInput]}
                      value={option.label}
                      onChangeText={(text) => updateServing(index, { label: text })}
                      placeholder="名称，如 1块"
                      placeholderTextColor={colors.textSecondary}
                      accessibilityLabel={`份量名称${index + 1}`}
                    />
                    <TextInput
                      style={[styles.input, styles.servingAmountInput]}
                      value={String(option.amountInCanonicalUnit)}
                      onChangeText={(text) => {
                        const parsed = parseFloat(text.replace(',', '.'));
                        updateServing(index, {
                          amountInCanonicalUnit: Number.isFinite(parsed) ? parsed : 0,
                        });
                      }}
                      keyboardType="decimal-pad"
                      accessibilityLabel={`份量数量${index + 1}`}
                    />
                    <Text style={styles.servingUnit}>{unit}</Text>
                    {option.origin === 'USER_DEFINED' ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`删除份量${index + 1}`}
                        onPress={() => setServings((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <Text style={styles.removeServing}>删除</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.removeServingDisabled}>系统份量不可删</Text>
                    )}
                  </View>
                );
              })}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="新增份量"
                onPress={() =>
                  setServings((prev) => [
                    ...prev,
                    {
                      id: `serving-${Date.now()}`,
                      label: '',
                      amountInCanonicalUnit: 0,
                      origin: 'USER_DEFINED' as const,
                    },
                  ])
                }
              >
                <Text style={styles.addServing}>+ 添加常用份量</Text>
              </Pressable>
            </>
          ) : null}

          {isPreset ? (
            <Text style={styles.estimateHint}>默认值仅作估算，优先以实际包装营养标签为准</Text>
          ) : null}

          {errors.length > 0 ? (
            <View style={styles.errorBox}>
              {errors.map((error) => (
                <Text key={error} style={styles.errorText}>
                  · {error}
                </Text>
              ))}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="保存"
            style={styles.saveButton}
            onPress={isPreset ? handleSavePreset : handleSaveCustom}
          >
            <Text style={styles.saveButtonText}>保存</Text>
          </Pressable>

          {isPreset && food && hasPresetOverride(food.id) ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="恢复默认"
              style={styles.resetButton}
              onPress={() => {
                onResetPresetOverride(food!.id);
                onClose();
              }}
            >
              <Text style={styles.resetButtonText}>恢复默认</Text>
            </Pressable>
          ) : null}

          {isCustomEdit ? (
            confirmDelete ? (
              <View style={styles.deleteConfirmBox}>
                <Text style={styles.deleteConfirmText}>
                  删除后将从当前计算与常用区一并移除，确定删除？
                </Text>
                <View style={styles.deleteConfirmRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="取消删除"
                    style={styles.cancelDeleteButton}
                    onPress={() => setConfirmDelete(false)}
                  >
                    <Text style={styles.resetButtonText}>取消</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="确认删除"
                    style={styles.deleteButton}
                    onPress={() => {
                      onDeleteCustom(food!.id);
                      onClose();
                    }}
                  >
                    <Text style={styles.deleteButtonText}>确认删除</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="删除自定义食物"
                style={styles.deleteButton}
                onPress={() => setConfirmDelete(true)}
              >
                <Text style={styles.deleteButtonText}>删除此食物</Text>
              </Pressable>
            )
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: radius.sheet,
  },
  cardContent: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  close: {
    fontSize: 18,
    color: colors.textSecondary,
    minHeight: 44,
    minWidth: 44,
    lineHeight: 44,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 46,
    borderRadius: radius.input,
    borderWidth: 0,
    backgroundColor: colors.controlBg,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSmall: {
    minHeight: 40,
    minWidth: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  servingOriginBadge: {
    minWidth: 30,
    alignItems: 'center',
  },
  servingOriginSystem: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  servingOriginUser: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  servingOriginOverridden: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
  },
  servingLabelInput: {
    flex: 2,
  },
  servingAmountInput: {
    flex: 1,
  },
  servingUnit: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  removeServing: {
    fontSize: 12,
    color: colors.danger,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
    lineHeight: 44,
  },
  removeServingDisabled: {
    fontSize: 10,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xs,
  },
  addServing: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    minHeight: 44,
    lineHeight: 44,
  },
  estimateHint: {
    marginTop: spacing.lg,
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorBox: {
    marginTop: spacing.md,
    borderRadius: radius.control,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  saveButton: {
    marginTop: spacing.lg,
    minHeight: 52,
    borderRadius: radius.control + 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
  resetButton: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteConfirmBox: {
    marginTop: spacing.sm,
    borderRadius: radius.control,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
  },
  deleteConfirmText: {
    fontSize: 13,
    color: colors.danger,
  },
  deleteConfirmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelDeleteButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  deleteButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
});
