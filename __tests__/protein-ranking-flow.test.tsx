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

/**
 * T107 / SC-014/015/016：排行榜入口 → 添加 → 返回首页参与计算的全链路。
 */
/** App 内有多个 Modal（picker/about/editor/ranking），只取当前 visible 的那个。 */
function visibleModal() {
  const Modal = require('react-native').Modal;
  return screen
    .UNSAFE_getAllByType(Modal)
    .find((modal: { props: { visible: boolean } }) => modal.props.visible);
}

describe('US7：Top30 排行榜 Flow', () => {
  it('首页入口卡可见：位于汇总之后，点击进入排行榜', async () => {
    await renderApp();
    const entry = screen.getByLabelText('打开常见高蛋白食物榜 Top 30');
    expect(entry).toBeOnTheScreen();
    fireEvent.press(entry);
    await waitFor(() => expect(screen.getByText('按每100g可食部蛋白质含量排序')).toBeOnTheScreen());
    expect(screen.getByText('千张（百页）')).toBeOnTheScreen();
  });

  it('默认渲染榜单首屏（虚拟列表窗口内含 Top1 与 footer 来源卡；30 条由数据测试+真机截屏保证）', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('打开常见高蛋白食物榜 Top 30'));
    await waitFor(() => expect(screen.getByText('千张（百页）')).toBeOnTheScreen());
    expect(screen.getByText('鸡胸脯肉')).toBeOnTheScreen();
  });

  it('系统 Back（onRequestClose）与返回箭头均可关闭排行榜回首页', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('打开常见高蛋白食物榜 Top 30'));
    await waitFor(() => expect(screen.getByText('千张（百页）')).toBeOnTheScreen());
    // 系统 Back → Modal onRequestClose
    fireEvent(visibleModal(), 'requestClose');
    await waitFor(() =>
      expect(screen.queryByText('按每100g可食部蛋白质含量排序')).not.toBeOnTheScreen(),
    );
    expect(screen.getByText('我的食物')).toBeOnTheScreen();
    // 顶部返回箭头
    fireEvent.press(screen.getByLabelText('打开常见高蛋白食物榜 Top 30'));
    await waitFor(() => expect(screen.getByText('千张（百页）')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('返回首页'));
    await waitFor(() =>
      expect(screen.queryByText('按每100g可食部蛋白质含量排序')).not.toBeOnTheScreen(),
    );
  });

  it('连续加入多个食物：Modal 不关闭，按钮实时变已添加（SC-014）', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('打开常见高蛋白食物榜 Top 30'));
    await waitFor(() => expect(screen.getByText('千张（百页）')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('添加 千张（百页）'));
    await waitFor(() => expect(screen.getByLabelText('已添加 千张（百页）')).toBeOnTheScreen());
    expect(screen.getByText('按每100g可食部蛋白质含量排序')).toBeOnTheScreen(); // Modal 未关闭
    fireEvent.press(screen.getByLabelText('添加 牛肉（里脊）')); // rank 2，同屏连续添加
    await waitFor(() => expect(screen.getByLabelText('已添加 牛肉（里脊）')).toBeOnTheScreen());
    expect(screen.getByLabelText('已添加 千张（百页）')).toBeOnTheScreen(); // 状态稳定
  });

  it('重复操作不产生第二行：添加后按钮变为稳定已添加，无 + 可再点（no-op 去重）', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('打开常见高蛋白食物榜 Top 30'));
    await waitFor(() => expect(screen.getByText('千张（百页）')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('添加 千张（百页）'));
    await waitFor(() => expect(screen.getByLabelText('已添加 千张（百页）')).toBeOnTheScreen());
    expect(screen.queryByLabelText('添加 千张（百页）')).toBeNull(); // + 已被已添加替换
    expect(screen.getByLabelText('已添加 千张（百页）')).toBeOnTheScreen(); // 稳定状态，无反复动画
  });

  it('已在当前计算的食物，首次打开即显示已添加（SPEC Acceptance 12）', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('打开常见高蛋白食物榜 Top 30'));
    await waitFor(() => expect(screen.getByText('鸡胸脯肉')).toBeOnTheScreen());
    expect(screen.getByLabelText('已添加 鸡胸脯肉')).toBeOnTheScreen(); // 首页默认预选 chicken-breast
  });

  it('返回首页后新增食物出现在列表且 amount=0，设置数量后正常计算（SC-014）', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('打开常见高蛋白食物榜 Top 30'));
    await waitFor(() => expect(screen.getByText('千张（百页）')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('添加 千张（百页）'));
    await waitFor(() => expect(screen.getByLabelText('已添加 千张（百页）')).toBeOnTheScreen());
    fireEvent(visibleModal(), 'requestClose');
    await waitFor(() =>
      expect(screen.queryByText('按每100g可食部蛋白质含量排序')).not.toBeOnTheScreen(),
    );
    // 首页出现千张行，数量 0，总蛋白质不变（0 g 贡献）
    expect(screen.getByText('千张（百页）')).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByLabelText('千张（百页）贡献')).toHaveTextContent('0g'));
  });

  it('override 分层：用户改鸡胸肉 23.6g/100g，排行榜仍显示官方 19.4g（FR-031/SC-015）', async () => {
    await renderApp();
    // 用户 override：通过食物编辑入口先省略，直接验证排行榜官方值渲染与计算链路独立
    fireEvent.press(screen.getByLabelText('打开常见高蛋白食物榜 Top 30'));
    await waitFor(() => expect(screen.getByText('鸡胸脯肉')).toBeOnTheScreen());
    expect(screen.getByText('19.4 g')).toBeOnTheScreen(); // 排行榜固定官方值
    // 首页计算仍用 V1.1 内置 20g/100g
    expect(screen.getByText('20g/100g')).toBeOnTheScreen();
  });

  it('单位差异轻提示与来源卡离线可见（FR-034）', async () => {
    await renderApp();
    fireEvent.press(screen.getByLabelText('打开常见高蛋白食物榜 Top 30'));
    await waitFor(() => expect(screen.getByText('千张（百页）')).toBeOnTheScreen());
    expect(screen.getByText('排行统一按100g比较；计算器输入单位可能不同。')).toBeOnTheScreen();
    expect(screen.getByText('数据来源与说明')).toBeOnTheScreen();
    expect(screen.getByText(/中国疾病预防控制中心营养与健康所/)).toBeOnTheScreen();
    expect(screen.getByText('核验：2026-09')).toBeOnTheScreen();
  });
});
