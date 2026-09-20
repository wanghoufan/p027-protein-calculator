import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistedStateV1 } from '../types';
import { createDefaultState, parsePersistedState, STORAGE_KEY } from './schema';

/**
 * AsyncStorage load/save/reset（T017 / FR-018 / US6.4）：
 * 未知 schema、损坏 JSON、字段异常一律安全回退默认状态，不允许白屏或启动崩溃。
 */
export async function loadState(): Promise<PersistedStateV1> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return createDefaultState();
    }
    const parsed: unknown = JSON.parse(raw);
    const state = parsePersistedState(parsed);
    return state ?? createDefaultState();
  } catch {
    return createDefaultState();
  }
}

export async function saveState(state: PersistedStateV1): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储写入失败不中断使用（单机估算场景）。
  }
}

export async function resetState(): Promise<PersistedStateV1> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略移除失败，返回默认状态即可。
  }
  return createDefaultState();
}
