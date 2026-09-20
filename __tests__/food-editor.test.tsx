import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';

beforeEach(async () => {
  await AsyncStorage.clear();
});
afterEach(async () => {
  await cleanup();
});

async function renderApp() {
  await render(<App />);
  await screen.findAllByText('60');
}

function contribution(name: string) {
  return within(screen.getByLabelText(`${name}贡献`));
}

async function openEditor(name: string) {
  fireEvent.press(screen.getByLabelText(`${name}更多操作`));
  fireEvent.press(screen.getByText('编辑营养值'));
  await waitFor(() => expect(screen.getByLabelText('自定义食物编辑器')).toBeOnTheScreen());
}

describe('US4：编辑 preset 营养值与常用份量', () => {
  it('鸡胸 20→23.6：300g 从 60g 变 70.8g；恢复默认回 60g', async () => {
    await renderApp();
    // 输入 300g
    const input = screen.getByLabelText('鸡胸肉数量');
    fireEvent.changeText(input, '300');
    fireEvent(input, 'blur');
    await waitFor(() => expect(contribution('鸡胸肉').getByText('60')).toBeOnTheScreen());

    await openEditor('鸡胸肉');
    const proteinInput = screen.getByLabelText('蛋白质含量');
    fireEvent.changeText(proteinInput, '23.6');
    fireEvent.press(screen.getByLabelText('保存'));
    await waitFor(() => expect(screen.queryByLabelText('自定义食物编辑器')).not.toBeOnTheScreen());
    // 立即重算：300g × 23.6/100 = 70.8
    await waitFor(() => expect(contribution('鸡胸肉').getByText('70.8')).toBeOnTheScreen());

    // 恢复默认
    await openEditor('鸡胸肉');
    fireEvent.press(screen.getByLabelText('恢复默认'));
    await waitFor(() => expect(screen.queryByLabelText('自定义食物编辑器')).not.toBeOnTheScreen());
    await waitFor(() => expect(contribution('鸡胸肉').getByText('60')).toBeOnTheScreen());
  });

  it('常用份量 1块 100→150g：serving 模式 +1 → 30g；canonical 150g 不变', async () => {
    await renderApp();
    await openEditor('鸡胸肉');
    fireEvent.changeText(screen.getByLabelText('份量数量1'), '150');
    fireEvent.press(screen.getByLabelText('保存'));
    await waitFor(() => expect(screen.queryByLabelText('自定义食物编辑器')).not.toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('鸡胸肉切份量'));
    fireEvent.press(screen.getByLabelText('鸡胸肉数量增加'));
    await waitFor(() => expect(contribution('鸡胸肉').getByText('30')).toBeOnTheScreen());
    // 切回 canonical：实际量 150g，蛋白质不变
    fireEvent.press(screen.getByLabelText('鸡胸肉切克数'));
    await waitFor(() => expect(screen.getByLabelText('鸡胸肉数量').props.value).toBe('150'));
    expect(contribution('鸡胸肉').queryByText('30')).toBeOnTheScreen();
  });

  it('canonical type/unit 不可编辑（固定显示），并显示默认值仅作估算提示', async () => {
    await renderApp();
    await openEditor('鸡胸肉');
    expect(screen.getByText(/数量类型固定为 g（mass），不可修改/)).toBeOnTheScreen();
    expect(screen.getByText(/默认值仅作估算，优先以实际包装营养标签为准/)).toBeOnTheScreen();
    expect(screen.queryByLabelText('食物名称')).not.toBeOnTheScreen();
  });

  it('保存校验：蛋白质/基准数量 ≤0 或空值时禁保存并就地提示', async () => {
    await renderApp();
    await openEditor('鸡胸肉');
    fireEvent.changeText(screen.getByLabelText('蛋白质含量'), '0');
    fireEvent.press(screen.getByLabelText('保存'));
    // 编辑器保持打开并显示错误
    await waitFor(() => expect(screen.getByText(/蛋白质含量必须大于 0/)).toBeOnTheScreen());
    expect(screen.getByLabelText('自定义食物编辑器')).toBeOnTheScreen();
  });
});
