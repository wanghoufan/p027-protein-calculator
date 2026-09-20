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
  // 等待 hydrate 完成后目标数字出现（默认 60kg × 日常维持/高档 1.0 = 60）
  await screen.findAllByText('60');
}

function getWeightInput() {
  return screen.getByLabelText('体重');
}

describe('US8 V1.5.1：四模式目标（60kg + 日常维持/high 1.0 → 60g/天）', () => {
  it('首次打开默认 60kg、日常维持·高档，显示 60g/天', async () => {
    await renderApp();
    expect(screen.getAllByText('60').length).toBeGreaterThan(0);
    // 模式一级：四个模式 chip 可见；档位显示系数（低 0.8×/高 1.0×）
    expect(screen.getByLabelText('日常维持')).toBeOnTheScreen();
    expect(screen.getByLabelText('健身维持')).toBeOnTheScreen();
    expect(screen.getByLabelText('增肌')).toBeOnTheScreen();
    expect(screen.getByLabelText('减脂保肌')).toBeOnTheScreen();
    expect(screen.getByText('低 0.8×')).toBeOnTheScreen();
    expect(screen.getByText('高 1.0×')).toBeOnTheScreen();
    // 新安装默认：日常维持选中
    expect(screen.getByLabelText('日常维持').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('高档 1.0 倍').props.accessibilityState.selected).toBe(true);
  });

  it('模式切换实时重算：增肌 high(2.0) → 60kg = 120g（SC-021）', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('增肌'));
    await waitFor(() => expect(screen.getAllByText('120').length).toBeGreaterThan(0));
    // 档位同时显示系数：低 1.6× / 高 2.0×（SPEC Acceptance）
    expect(screen.getByText('低 1.6×')).toBeOnTheScreen();
    expect(screen.getByText('高 2.0×')).toBeOnTheScreen();
    // 保持高档，切低档 → 60 × 1.6 = 96
    fireEvent.press(screen.getByLabelText('低档 1.6 倍'));
    await waitFor(() => expect(screen.getAllByText('96').length).toBeGreaterThan(0));
  });

  it('档位切换实时重算：日常维持 低(0.8) → 60kg = 48g', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('低档 0.8 倍'));
    await waitFor(() => expect(screen.getAllByText('48').length).toBeGreaterThan(0));
  });

  it('手工输入体重实时更新：70kg × 1.0 = 70g', async () => {
    await renderApp();
    const input = getWeightInput();
    fireEvent.changeText(input, '70');
    fireEvent(input, 'blur');
    await waitFor(() => expect(screen.getAllByText('70').length).toBeGreaterThan(0));
  });

  it('非法体重（0）不计算并就地提示（FR-055）', async () => {
    await renderApp();
    const input = getWeightInput();
    fireEvent.changeText(input, '0');
    fireEvent(input, 'blur');
    await waitFor(() => expect(screen.getAllByText(/请输入有效体重/).length).toBeGreaterThan(0));
    // 目标占位符 —，不再显示旧目标
    expect(screen.queryAllByText('60')).toHaveLength(0);
  });

  it('-/+ 步长 1kg', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('体重增加'));
    await waitFor(() => expect(screen.getAllByText('61').length).toBeGreaterThan(0));
    fireEvent.press(screen.getByLabelText('体重减少'));
    fireEvent.press(screen.getByLabelText('体重减少'));
    await waitFor(() => expect(screen.getAllByText('59').length).toBeGreaterThan(0));
  });

  it('模式/档位变化即时重算目标，不清空食物记录（SC-021）', async () => {
    await renderApp();
    // 鸡胸 +50g → 10g 贡献
    fireEvent.press(screen.getByLabelText('鸡胸肉数量增加'));
    await waitFor(() => expect(screen.getByLabelText('鸡胸肉贡献')).toHaveTextContent('10g'));
    // 切换模式与档位
    fireEvent.press(screen.getByLabelText('减脂保肌'));
    fireEvent.press(screen.getByLabelText('高档 2.4 倍'));
    // 目标变为 60 × 2.4 = 144
    await waitFor(() => expect(screen.getAllByText('144').length).toBeGreaterThan(0));
    // 食物贡献保留
    expect(screen.getByLabelText('鸡胸肉贡献')).toHaveTextContent('10g');
  });

  it('如何选择？打开目标选择 sheet；查看模式说明打开详情', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('如何选择蛋白质目标'));
    await waitFor(() => expect(screen.getByText('选择蛋白质目标')).toBeOnTheScreen());
    // 四模式纵向卡片 + 范围
    expect(screen.getByText('0.8 – 1.0')).toBeOnTheScreen();
    expect(screen.getByText('1.6 – 2.4')).toBeOnTheScreen();
    // 选择增肌生效（保持当前高档）→ 60 × 2.0 = 120
    fireEvent.press(screen.getByLabelText('增肌，1.6 到 2'));
    await waitFor(() => expect(screen.getAllByText('120').length).toBeGreaterThan(0));
    // 打开模式说明
    fireEvent.press(screen.getByLabelText('查看模式说明'));
    await waitFor(() => expect(screen.getByText('蛋白质目标说明')).toBeOnTheScreen());
    // 健康边界与高档提醒可见（FR-042）
    expect(screen.getByText(/高档不代表越高越好/)).toBeOnTheScreen();
    expect(screen.getByText(/不提供医疗诊断或个体化营养处方/)).toBeOnTheScreen();
  });
});
