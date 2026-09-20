import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistedState } from '../types';
import { createDefaultState, STORAGE_KEY } from './schema';
import { migratePersistedState } from './migrations';

/**
 * AsyncStorage load/save/reset（T017 / FR-018 / US6.4）：
 * 未知 schema、损坏 JSON、字段异常一律安全回退默认状态，不允许白屏或启动崩溃。
 * V1.5.1：加载时执行 v1→v2 单步受控迁移（deterministic/idempotent，先校验后采用），
 * 迁移结果随后由 hook 的 debounce save 写回存储。
 */
export async function loadState(): Promise<PersistedState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return createDefaultState();
    }
    const parsed: unknown = JSON.parse(raw);
    const state = migratePersistedState(parsed);
    return state ?? createDefaultState();
  } catch {
    return createDefaultState();
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储写入失败不中断使用（单机估算场景）。
  }
}

export async function resetState(): Promise<PersistedState> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略移除失败，返回默认状态即可。
  }
  return createDefaultState();
}
