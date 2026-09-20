# QA 执行协议｜真机采集与视觉复核

## 目的

明确当前项目中设备操作、证据采集、QA 判定和监督复核的边界，避免把编排者窗口的设备能力误认为 QA 子代理能力。

## 当前模型与 Runtime

以下为本次分支测试使用的当前配置快照；模型母版仍以项目上级目录的 `USER_MODEL_OVERRIDE.md` 为准。

| 角色          | 当前模型                                   | Runtime                     | 本协议中的职责             |
| ------------- | ------------------------------------------ | --------------------------- | -------------------------- |
| task-manager  | 开窗口时定                                 | 本窗口 CUA/Bash             | 唯一真机操作和证据采集者   |
| builder       | `codebuddy/deepseek-v4.1-flash`            | codebuddy                   | 开发、构建、静态证据       |
| qa            | `codex/gpt-5.6-luna`                       | codex；真机采集由本窗口执行 | 测试、日志、截图和视觉复核 |
| supervisor    | `opencode-go/muse-spark-1.3-contributor`   | opencode                    | 证据链和状态监督           |
| code-reviewer | `opencode/muse-spark-1.3-contributor-free` | 本窗口                      | 代码复核                   |

## 模型能力探针记录

验证日期：2026-09-20。

- `codex/gpt-5.6-luna`：`VISION_PROBE=PASS`。成功读取原型图和真实截图，识别主色为绿色，并判断实际截图没有默认 Expo 图标。
- `codebuddy/deepseek-v4.1-flash`：真实截图可读取，但 CodeBuddy Read Runtime 无法读取上级 `docs/design` 原型图；双图探针为 `FAIL / NOT_VERIFIED`。这记录为 Runtime 路径权限缺口，不把模型能力误判为通过。
- 结论：Luna 当前可用于双图视觉复核；DeepSeek 当前只能确认单图读取，不能在本 Runtime 下承担双图视觉复核。

## 角色分工

| 环节               | 执行者                | 输出                               |
| ------------------ | --------------------- | ---------------------------------- |
| `DEVICE_CAPTURE`   | task-manager 当前窗口 | 设备操作结果、截图、日志、构建信息 |
| `QA_REVIEW`        | QA 模型               | 功能、回归和视觉复核结论           |
| `SUPERVISOR_CHECK` | supervisor            | 证据链和状态一致性结论             |

## DEVICE_CAPTURE

正式真机用例前，task-manager 必须确认：

- 目标构建可启动；
- 设备或模拟器已连接；
- 点击、输入、滚动、返回和重启能力可用；
- 截图和日志可以保存；
- 当前操作针对目标平台，不把 Mac 预检当作 Android 验收。

采集包至少包含：

- 构建类型：debug / release / preview；
- 设备或模拟器信息；
- 测试步骤结果；
- 关键日志；
- 启动页、首页、添加食物、分类、编辑等关键页面截图。

## QA_REVIEW

QA 模型一次性接收：

- 对应 UI 原型图；
- 真实运行截图；
- 测试步骤结果；
- 关键日志；
- 构建类型和设备信息。

QA 输出必须区分：

```text
RUNTIME_QA=PASS|FAIL|NOT_VERIFIED
VISUAL_QA=PASS|FAIL|NOT_VERIFIED
```

模型没有收到图片、无法读取图片或只收到图片路径时，`VISUAL_QA` 必须为 `NOT_VERIFIED`，不得猜测。

## SUPERVISOR_CHECK

supervisor 不操作真机，也不在没有图片输入时替代 QA 做视觉判断，只检查：

- `DEVICE_CAPTURE` 是否由 task-manager 当前窗口执行；
- 证据包是否齐全；
- QA 是否收到原型图和真实截图；
- QA 结论是否超出证据能力；
- `TASKS`、QA 报告和 HANDOFF 状态是否一致。

## 证据状态

```text
SOURCE_READY       代码和资源已完成
RUNTIME_CAPTURED   已取得真实运行截图和日志
RUNTIME_QA_PASS    真机步骤通过
VISUAL_QA_PASS     QA 已完成原型对照
```

`RUNTIME_CAPTURED` 不等于 `RUNTIME_QA_PASS`，`RUNTIME_QA_PASS` 也不等于 `VISUAL_QA_PASS`。
