# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## QA 执行边界

- 真机设备操作的唯一执行者是 task-manager 当前窗口；QA 子代理不得假设自己能调用该窗口的 CUA、adb 或模拟器。
- 真机 QA 分成两段：`DEVICE_CAPTURE` 由 task-manager 按固定用例操作设备并采集截图/日志；`QA_REVIEW` 由 QA 模型读取证据并输出 `PASS / FAIL / NOT_VERIFIED`。
- 视觉 QA 必须同时收到原型图和真实运行截图。只有确认图片已传入且可读，才能输出 `VISUAL_QA=PASS`。
- 没有设备操作证据不得写 `RUNTIME_QA=PASS`；没有真实截图不得写 `VISUAL_QA=PASS`。
- task-manager 只负责批量采集证据，不替代 QA 做最终判定；supervisor 只检查证据链和状态一致性。
