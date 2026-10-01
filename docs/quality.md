# 最终交付验证

日期：2026-10-01。当前发布文件仅为 `videos/` 内的配乐版与仅拟音版，两版均已包含骑行修订。

## 技术测量

[technical-check.json](../qa/technical-check.json) 记录：

- 完整解码 3000 帧；1920×1080、30 fps、100 秒。
- 开场/收尾淡出以外的异常黑帧：0。
- 排除正常切点后的异常全局亮度跳变：0。
- 三个音频测量窗口 19–23、46–51、82–88 秒的时差：均为 0 samples / 0 帧。
- 主版峰值 -4.91 dBFS；RMS -22.98 dBFS。
- 两版全部视频包 SHA-256 一致：`4b40db9003ddcd62162d944759bbd3df887ba1fb03db04d98704a26fb08ad7f8`。

整文件 SHA-256 另列于 [videos/SHA256SUMS](../videos/SHA256SUMS)。视频包哈希与包含音轨的整文件哈希不是同一指标。

## 视觉复核与修订范围

整片曾依据实际编码 MP4 的关键帧、切点、原生分辨率画面，以及针线、卷旗、升旗、回窗的密集采样检查。镜头切换时 f1083 的单帧暗闪已修复。原审查对人物采用微缩雕塑造型、布面为程序变形的方向进行核对。

随后单独修订骑行段 f1350–1859（45–62 秒）：曲柄向前蹬踏，鞋尖朝前，前掌落在踏板上，左右脚相差半圈，腿部保持固定长度。最新 [骑行独立复核](../qa/cycling-independent-review.md) 检查当前实际完整成片的密集帧、局部与四处切点。

- 骑行修订片段与完整主版逐帧解码比对：**510 / 510 相同**，见 [final-verification.json](../qa/cycling-independent/final-verification.json)。
- 修改范围以外 **2490 个视频包**的 PTS 与逐包哈希无差异，见 [cycling-packet-preservation.json](../qa/cycling-packet-preservation.json)。
- 固定腿长与脚踏接触的数学测量见 [cycling-check.json](../qa/cycling-check.json) 和 [独立测量](../qa/cycling-independent/math.json)。
- 最终成片分镜联系表见 [storyboard.jpg](storyboard.jpg)；骑行最终联系表和局部证据在 [qa/cycling-independent/final/](../qa/cycling-independent/final/)。

为保持仓库精简，仅收录最终技术记录、修订复核、联系表与局部证据。原始全量逐帧临时文件、旧片和旧哈希基准未打包。

## 验证的实际边界

技术扫描检查全局亮度和帧完整性；它不证明每一帧所有局部都完美。视觉复核来自实际视频采样，未将其描述为真人全速观看。声音仅测量信号、时差和峰值，未据此声称音色、音乐接缝或持续摩擦的主观听感已验收。

现有可选改进包括：大旗切小旗时进一步对齐星的位置、减少侧拍字幕对低位脚踏的遮挡、补充收尾远景建筑，以及实际试听后再调整较轻的持续布面摩擦。这些不改变当前发布版本的修订结果。

## 仓库复现检查

发布前在独立仓库目录完成 `npm ci`、TypeScript 检查与 Remotion 打包。素材准备命令成功获取官方配乐并通过全部文件校验，重建的三个 WAV 与原工程 SHA-256 完全相同。README 本地链接、两份视频完整性及重新执行的整片检查均通过，记录见 [repository-check.json](../qa/repository-check.json)。
