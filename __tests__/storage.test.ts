import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDefaultState, parsePersistedState, STORAGE_KEY } from '../src/storage/schema';
import { loadState } from '../src/storage/storage';

/** 构造一份合法 V1 状态：weight/coefficient 合法，食物全部指向已知 preset。 */
function buildValidState() {
  const state = createDefaultState();
  state.selectedFoods = [
    { foodId: 'chicken-breast', amountInCanonicalUnit: 300, inputMode: 'canonical' },
    { foodId: 'whole-egg', amountInCanonicalUnit: 2, inputMode: 'serving' },
  ];
  state.recentFoodIds = ['chicken-breast', 'whole-egg'];
  return state;
}

describe('parsePersistedState（QA-V1-003）', () => {
  it('未知 schemaVersion 返回 null', () => {
    expect(parsePersistedState({ ...buildValidState(), schemaVersion: 999 })).toBeNull();
    expect(parsePersistedState({ ...buildValidState(), schemaVersion: '1' })).toBeNull();
  });

  it('orphan（指向不存在食物）的 selectedFoods/recentFoodIds 被清理', () => {
    const state = buildValidState();
    state.selectedFoods = [
      ...state.selectedFoods,
      { foodId: 'ghost-food', amountInCanonicalUnit: 100, inputMode: 'canonical' },
    ];
    state.recentFoodIds = [...state.recentFoodIds, 'ghost-food'];

    const parsed = parsePersistedState(state);

    expect(parsed).not.toBeNull();
    expect(parsed!.selectedFoods.map((item) => item.foodId)).toEqual([
      'chicken-breast',
      'whole-egg',
    ]);
    expect(parsed!.recentFoodIds).toEqual(['chicken-breast', 'whole-egg']);
  });

  it('recentFoodIds 去重并截断为最多 4 个', () => {
    const state = buildValidState();
    state.recentFoodIds = [
      'chicken-breast',
      'milk',
      'chicken-breast',
      'whole-egg',
      'shrimp',
      'fish',
      'north-tofu',
    ];

    const parsed = parsePersistedState(state);

    expect(parsed!.recentFoodIds).toEqual(['chicken-breast', 'milk', 'whole-egg', 'shrimp']);
    expect(parsed!.recentFoodIds).toHaveLength(4);
  });
});

describe('loadState（QA-V1-003）', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('损坏 JSON 回退默认状态', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{"schemaVersion":1, broken!!!');

    const state = await loadState();

    expect(state).toEqual(createDefaultState());
  });

  it('未知 schema 回退默认状态', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...buildValidState(), schemaVersion: 999 }),
    );

    const state = await loadState();

    expect(state).toEqual(createDefaultState());
  });

  it('存储中的 orphan 条目加载后被清理', async () => {
    const stored = buildValidState();
    stored.selectedFoods = [
      ...stored.selectedFoods,
      { foodId: 'ghost-food', amountInCanonicalUnit: 100, inputMode: 'canonical' },
    ];
    stored.recentFoodIds = [...stored.recentFoodIds, 'ghost-food'];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const state = await loadState();

    expect(state.selectedFoods.map((item) => item.foodId)).toEqual(['chicken-breast', 'whole-egg']);
    expect(state.recentFoodIds).toEqual(['chicken-breast', 'whole-egg']);
  });

  it('存储为空时返回默认状态', async () => {
    expect(await loadState()).toEqual(createDefaultState());
  });
});
