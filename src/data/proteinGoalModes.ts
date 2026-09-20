import { ProteinGoalMode } from '../types';

/**
 * V1.5.1 目标模式统一文案（T125 / FR-040~042 / 口径文档归因规则）：
 * - 四模式是“证据锚点 + 产品化映射”，不得写“官方规定”；
 * - 0.8=一般成人 RDA 锚点；1.0=产品高档；1.2–1.6=AIS 重训练范围；
 *   1.6–2.0=运动营养共识高区间产品化；1.6–2.4=AIS+World Athletics 减脂保肌；
 * - 来源入口放说明页，首页不堆砌来源（Constitution Principle III）。
 */
export interface ProteinGoalModeCopy {
  mode: ProteinGoalMode;
  name: string;
  /** 模式一句话适用说明（模式列表/首页短说明）。 */
  tagline: string;
  /** 适用场景（详情页）。 */
  scenario: string;
  /** 为什么是这个范围（详情页）。 */
  rationale: string;
  /** 来源列表（详情页，FR-041）。 */
  sources: readonly string[];
  /** 图标语义 key（UI 选择本地图标/emoji）。 */
  icon: 'leaf' | 'dumbbell' | 'arm' | 'flame';
}

export const PROTEIN_GOAL_MODE_COPY: Readonly<Record<ProteinGoalMode, ProteinGoalModeCopy>> = {
  daily_maintenance: {
    mode: 'daily_maintenance',
    name: '日常维持',
    tagline: '适合日常健康生活，维持身体机能。',
    scenario: '一般健康成年人的日常生活，没有规律的高强度训练。',
    rationale:
      '低档 0.8 g/kg 是一般健康成人蛋白质 RDA 的常用基础锚点；高档 1.0 是本 App 为日常模式设置的产品化简化高档。',
    sources: ['National Academies DRI（成人 RDA 背景）', 'NIH ODS 运动营养资料'],
    icon: 'leaf',
  },
  fitness_maintenance: {
    mode: 'fitness_maintenance',
    name: '健身维持',
    tagline: '规律运动，维持肌肉量与身体状态。',
    scenario: '有规律健身/训练习惯，关注训练恢复与肌肉维持。',
    rationale:
      '基于 AIS（澳大利亚体育学院）对重训练运动员公开建议范围 1.2–1.6 g/kg/天，产品化为规律健身维持场景。',
    sources: ['AIS Sports Nutrition'],
    icon: 'dumbbell',
  },
  muscle_gain: {
    mode: 'muscle_gain',
    name: '增肌',
    tagline: '规律力量训练，以增加肌肉量为主要目标。',
    scenario: '规律力量训练，以构建和维持肌肉量为主要目标。',
    rationale:
      '基于运动营养权威指南与专业共识综合设置：AND/DC/ACSM 联合立场对运动人群总体约 1.2–2.0 g/kg/天，ISSN 综述对构建维持肌肉量的多数运动个体约 1.4–2.0 g/kg/天；本 App 取较高区间 1.6–2.0 作为增肌模式。',
    sources: ['ACSM / 运动营养共识', 'ISSN 综述（产品化映射说明见 rationale）'],
    icon: 'arm',
  },
  fat_loss_muscle_retention: {
    mode: 'fat_loss_muscle_retention',
    name: '减脂保肌',
    tagline: '在热量缺口下，保留肌肉，减少脂肪。',
    scenario: '控制热量减重，同时希望尽量保留瘦体重（肌肉）。',
    rationale:
      'AIS 与 World Athletics 对减重且强调保留瘦体重的场景均有 1.6–2.4 g/kg/天的直接支持；2.4 是范围高端，不代表越高越好。',
    sources: ['AIS Sports Nutrition', 'World Athletics Consensus'],
    icon: 'flame',
  },
} as const;

/** 高档提醒（FR-042，固定文案）。 */
export const HIGH_LEVEL_REMINDER = '高档不代表越高越好，请结合训练量与个人情况选择。';

/** 通用健康边界（FR-042 / Constitution Principle IV，固定文案）。 */
export const HEALTH_BOUNDARY_LINES = [
  '本 App 为一般营养/健身估算工具，不提供医疗诊断或个体化营养处方。',
  '面向一般健康成年人（18+）；未成年人、孕期/哺乳期、医生或营养师要求调整蛋白质摄入、存在可能影响蛋白质目标的疾病或治疗者，请以专业人员建议为准。',
] as const;

/** 迁移提示（legacy 1.5→1.6）固定文案。 */
export const GOAL_MODEL_MIGRATION_NOTICE =
  '目标模式已升级：原健身估算 1.5 g/kg 已映射为「健身维持·高档 1.6 g/kg」，今日目标会相应提高。点击确认或重新选择目标模式。';
