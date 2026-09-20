import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';

beforeEach(async () => {
  await AsyncStorage.clear();
});

afterEach(() => {
  cleanup();
});

async function renderApp() {
  await render(<App />);
  // 等待 hydrate 完成后目标数字出现（默认 60kg × 1.5 = 90）
  await screen.findAllByText('90');
}

function getWeightInput() {
  return screen.getByLabelText('体重');
}

describe('US1：每日目标（60kg + 1.5 → 90g/天）', () => {
  it('首次打开默认 60kg、1.5，显示 90g/天', async () => {
    await renderApp();
    expect(screen.getAllByText('90').length).toBeGreaterThan(0);
    expect(screen.getByText(/健身估算/)).toBeOnTheScreen();
  });

  it('男生快捷预设 = 60kg', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('男生 60kg'));
    fireEvent.press(screen.getByLabelText('基础估算 1.0 g/kg'));
    await waitFor(() => expect(screen.getAllByText('60').length).toBeGreaterThan(0));
  });

  it('女生快捷预设 = 50kg，仅修改体重', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('女生 50kg'));
    await waitFor(() => expect(screen.getAllByText('75').length).toBeGreaterThan(0));
  });

  it('系数切换实时更新：1.0 → 60g', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('基础估算 1.0 g/kg'));
    await waitFor(() => expect(screen.getAllByText('60').length).toBeGreaterThan(0));
  });

  it('手工输入体重实时更新：70kg × 1.5 = 105g', async () => {
    await renderApp();
    const input = getWeightInput();
    fireEvent.changeText(input, '70');
    fireEvent(input, 'blur');
    await waitFor(() => expect(screen.getAllByText('105').length).toBeGreaterThan(0));
  });

  it('非法体重（0）不计算并就地提示', async () => {
    await renderApp();
    const input = getWeightInput();
    fireEvent.changeText(input, '0');
    fireEvent(input, 'blur');
    await waitFor(() => expect(screen.getAllByText(/请输入有效体重/).length).toBeGreaterThan(0));
    expect(screen.queryAllByText('90')).toHaveLength(0);
  });

  it('手工修改后快捷预设取消高亮（自定义状态）', async () => {
    await renderApp();
    const input = getWeightInput();
    fireEvent.changeText(input, '65');
    fireEvent(input, 'blur');
    await waitFor(() => expect(screen.getAllByText('97.5').length).toBeGreaterThan(0));
    expect(screen.getByLabelText('男生 60kg').props.accessibilityState.selected).toBe(false);
    expect(screen.getByLabelText('女生 50kg').props.accessibilityState.selected).toBe(false);
  });

  it('-/+ 步长 1kg', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('体重增加'));
    await waitFor(() => expect(screen.getAllByText('91.5').length).toBeGreaterThan(0));
    fireEvent.press(screen.getByLabelText('体重减少'));
    fireEvent.press(screen.getByLabelText('体重减少'));
    await waitFor(() => expect(screen.getAllByText('88.5').length).toBeGreaterThan(0));
  });
});
