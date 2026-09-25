/**
 * 方案 B 色板：米白背景、健康绿主色、圆角白卡、轻阴影。
 * Change B：新增深色色板 darkColors，两套同构（Palette 由 lightColors 推导）。
 * 所有组件一律经 useTheme().colors 取色，不再静态引用。
 */
export const lightColors = {
  background: '#F7F4EC',
  surface: '#FFFFFF',
  primary: '#2E7D4F',
  primarySoft: '#E4F1E8',
  targetCard: '#ECF8EC',
  controlBg: '#F1F4F1',
  textPrimary: '#1F2A24',
  textSecondary: '#7C8A81',
  border: '#E3E0D5',
  danger: '#C6453D',
  dangerSoft: '#F9E9E7',
  progressTrack: '#EDEAE0',
  // 散落硬编码收敛（浅色原值）：
  overlay: 'rgba(0,0,0,0.35)',
  warningBg: '#FBF3DF',
  warningText: '#8A6D1F',
  rankingRowBg: '#FBF7EE',
  // 排行榜 1/2/3 名奖牌色（深底同样可读，两套一致）。
  medalGold: '#E8A93D',
  medalSilver: '#A8B0B8',
  medalBronze: '#C08552',
};

export type Palette = typeof lightColors;

export const darkColors: Palette = {
  background: '#0F1512',
  surface: '#1A231E',
  primary: '#57B17E',
  primarySoft: '#1E3327',
  targetCard: '#16241C',
  controlBg: '#222C26',
  textPrimary: '#EAF2EC',
  textSecondary: '#9DB0A4',
  border: '#2A362F',
  danger: '#E5736B',
  dangerSoft: '#3A2320',
  progressTrack: '#263028',
  overlay: 'rgba(0,0,0,0.35)',
  warningBg: '#2E2A17',
  warningText: '#E3C878',
  rankingRowBg: '#1E1A12',
  medalGold: '#E8A93D',
  medalSilver: '#A8B0B8',
  medalBronze: '#C08552',
};
