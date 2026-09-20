import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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
  await screen.findAllByText('90');
}

async function addProtein(foodName: string, times = 1) {
  for (let i = 0; i < times; i++) {
    fireEvent.press(screen.getByLabelText(`${foodName}数量增加`));
    await waitFor(() => {});
  }
}

function expectContribution(foodName: string, value: string) {
  return waitFor(() =>
    expect(screen.getByLabelText(`${foodName}贡献`)).toHaveTextContent(`${value}g`),
  );
}

describe('US2：当前食物组合计算', () => {
  it('首次安装预选 4 行，数量均为 0', async () => {
    await renderApp();
    for (const name of ['鸡胸肉', '全蛋', '牛奶', '蛋清']) {
      expect(screen.getByText(name)).toBeOnTheScreen();
    }
    expect(screen.getByText('20g/100g')).toBeOnTheScreen();
    expect(screen.getByText('7g/1个')).toBeOnTheScreen();
    expect(screen.getByText('3g/100ml')).toBeOnTheScreen();
    await expectContribution('鸡胸肉', '0');
  });

  it('MASS 步长 50g：鸡胸 +1 → 50g → 10g 蛋白质', async () => {
    await renderApp();
    await addProtein('鸡胸肉');
    await expectContribution('鸡胸肉', '10');
  });

  it('COUNT 步长 1：全蛋 +1 → 1个 → 7g', async () => {
    await renderApp();
    await addProtein('全蛋');
    await expectContribution('全蛋', '7');
  });

  it('VOLUME 步长 50ml：牛奶 +1 → 50ml → 1.5g', async () => {
    await renderApp();
    await addProtein('牛奶');
    await expectContribution('牛奶', '1.5');
  });

  it('直接输入：鸡胸 300g → 60g；总量与差值实时更新（还差 30）', async () => {
    await renderApp();
    const input = screen.getByLabelText('鸡胸肉数量');
    fireEvent.changeText(input, '300');
    fireEvent(input, 'blur');
    await expectContribution('鸡胸肉', '60');
    await waitFor(() => expect(screen.getByText(/还差 30/)).toBeOnTheScreen());
    expect(screen.getByText(/已摄入/)).toBeOnTheScreen();
  });

  it('serving 模式：切换不改变实际量，+1块 → 100g → 20g；切回 canonical 仍 100g', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('鸡胸肉切份量'));
    await addProtein('鸡胸肉');
    await expectContribution('鸡胸肉', '20');
    fireEvent.press(screen.getByLabelText('鸡胸肉切克数'));
    // 切回 canonical：实际量仍 100g，蛋白质仍 20
    await waitFor(() => expect(screen.getByLabelText('鸡胸肉数量').props.value).toBe('100'));
    await expectContribution('鸡胸肉', '20');
  });

  it('超出目标：鸡胸 450g 已达标，再加 50g 超出 10', async () => {
    await renderApp();
    const input = screen.getByLabelText('鸡胸肉数量');
    fireEvent.changeText(input, '450');
    fireEvent(input, 'blur');
    await waitFor(() => expect(screen.getByText(/已达标/)).toBeOnTheScreen());
    await addProtein('鸡胸肉');
    await waitFor(() => expect(screen.getByText(/超出 10/)).toBeOnTheScreen());
  });

  it('清空只归零数量，不删除行', async () => {
    await renderApp();
    await addProtein('鸡胸肉');
    await expectContribution('鸡胸肉', '10');
    fireEvent.press(screen.getByLabelText('清空数量'));
    await waitFor(() => expectContribution('鸡胸肉', '0'));
    expect(screen.getByText('鸡胸肉')).toBeOnTheScreen();
  });

  it('从当前计算移除：行消失', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('鸡胸肉更多操作'));
    fireEvent.press(screen.getByText('从当前计算移除'));
    await waitFor(() => expect(screen.queryByText('鸡胸肉')).not.toBeOnTheScreen());
  });
});
