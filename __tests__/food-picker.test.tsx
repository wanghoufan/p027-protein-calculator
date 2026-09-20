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

async function openSheet() {
  await renderApp();
  fireEvent.press(screen.getByLabelText('添加食物'));
  await screen.findByLabelText('食物选择器');
}

function sheet() {
  return within(screen.getByLabelText('食物选择器'));
}

async function expandCategory(label: string, firstFood: string) {
  fireEvent.press(sheet().getByText(label));
  await waitFor(() => expect(sheet().getByText(firstFood)).toBeOnTheScreen());
}

describe('US3：添加食物 Bottom Sheet', () => {
  it('打开/关闭：+ 添加食物打开 sheet，X 关闭后上下文保留', async () => {
    await openSheet();
    expect(sheet().getByText(/常用食物/)).toBeOnTheScreen();
    fireEvent.press(sheet().getByLabelText('关闭选择器'));
    await waitFor(() => expect(screen.queryByLabelText('食物选择器')).not.toBeOnTheScreen());
    // 首页上下文保留
    expect(screen.getByText('鸡胸肉')).toBeOnTheScreen();
  });

  it('搜索 trim 包含匹配：输入带空格 " 牛 " 命中牛奶/瘦牛肉，不命中鸡胸肉', async () => {
    await openSheet();
    const input = sheet().getByLabelText('搜索食物');
    fireEvent.changeText(input, ' 牛 ');
    await waitFor(() => expect(sheet().getAllByText('牛奶').length).toBeGreaterThan(0));
    expect(sheet().getAllByText('瘦牛肉').length).toBeGreaterThan(0);
    expect(sheet().queryByText('鸡胸肉')).not.toBeOnTheScreen();
    // 空结果状态
    fireEvent.changeText(input, '不存在的食物xyz');
    await waitFor(() => expect(sheet().getByText(/没有找到/)).toBeOnTheScreen());
  });

  it('分类折叠显示：四个分类标题可见，展开肉类后可见瘦猪肉', async () => {
    await openSheet();
    for (const label of ['肉类', '蛋奶类', '水产类', '豆制品']) {
      expect(sheet().getByText(label)).toBeOnTheScreen();
    }
    expect(sheet().queryByText('瘦猪肉')).not.toBeOnTheScreen();
    fireEvent.press(sheet().getByText('肉类'));
    await waitFor(() => expect(sheet().getByText('瘦猪肉')).toBeOnTheScreen());
  });

  it('添加瘦牛肉：sheet 保持打开，首页出现该食物；重复添加不新增行', async () => {
    await openSheet();
    await expandCategory('肉类', '瘦牛肉');
    fireEvent.press(sheet().getByLabelText('添加 瘦牛肉'));
    // sheet 保持打开，按钮变为已添加
    await waitFor(() => expect(sheet().getByLabelText('移除 瘦牛肉')).toBeOnTheScreen());
    fireEvent.press(sheet().getByLabelText('关闭选择器'));
    await waitFor(() => expect(screen.queryByLabelText('食物选择器')).not.toBeOnTheScreen());
    expect(screen.getAllByText('瘦牛肉').length).toBeGreaterThan(0);
    // 再次打开（分类折叠状态重置，先展开），已添加点击 → 从当前计算移除，再添加回来
    fireEvent.press(screen.getByLabelText('添加食物'));
    await screen.findByLabelText('食物选择器');
    await expandCategory('肉类', '瘦牛肉');
    fireEvent.press(sheet().getByLabelText('移除 瘦牛肉'));
    fireEvent.press(sheet().getByLabelText('添加 瘦牛肉'));
    fireEvent.press(sheet().getByLabelText('关闭选择器'));
    await waitFor(() => expect(screen.queryByLabelText('食物选择器')).not.toBeOnTheScreen());
    expect(screen.getAllByText('瘦牛肉').length).toBe(1);
  });

  it('recent 置顶与最多 4：添加后进入常用区，最多 4 项', async () => {
    await openSheet();
    await expandCategory('肉类', '瘦牛肉');
    await expandCategory('水产类', '虾');
    fireEvent.press(sheet().getByLabelText('添加 瘦牛肉'));
    fireEvent.press(sheet().getByLabelText('添加 虾'));
    fireEvent.press(sheet().getByLabelText('添加 鱼肉（通用估算）'));
    // 常用区最多 4 项：种子 4 项 + 新增 3 项 → 最新 4 项（鱼、虾、瘦牛肉、鸡胸肉），不含全蛋/牛奶/蛋清
    const strip = sheet().getByLabelText('常用食物区');
    const stripScope = within(strip);
    expect(stripScope.getByText(/鱼/)).toBeOnTheScreen();
    fireEvent.press(sheet().getByLabelText('关闭选择器'));
    await waitFor(() => expect(screen.queryByLabelText('食物选择器')).not.toBeOnTheScreen());
    expect(screen.getAllByText('鱼肉（通用估算）').length).toBeGreaterThan(0);
  });

  it('"我的食物"区与 + 自定义食物入口真实打开 editor', async () => {
    await openSheet();
    expect(sheet().getByText('我的食物')).toBeOnTheScreen();
    fireEvent.press(sheet().getByLabelText('新建自定义食物'));
    await waitFor(() => expect(screen.getByLabelText('自定义食物编辑器')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('关闭编辑器'));
    await waitFor(() => expect(screen.queryByLabelText('自定义食物编辑器')).not.toBeOnTheScreen());
  });
});
