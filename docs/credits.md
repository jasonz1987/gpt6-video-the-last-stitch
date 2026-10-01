# 素材来源与许可

本片的三维场景、人物、旗面、物件、运动和织物/木材/路面贴图由本工程代码构建。背景音乐与录制声音使用下列素材，音乐并非本项目原创作曲。

| 用途 | 素材与作者 | 来源 | 许可与打包方式 |
| --- | --- | --- | --- |
| 配乐 | Silent Descent — Eugenio Mininni | [Mixkit](https://mixkit.co/free-stock-music/tag/cinematic/) | [Stock Music Free License](https://mixkit.co/license/modal/musicFree/)，保留在成片中；原始 MP3 与派生音乐 WAV 在本地获取、生成 |
| 针线 | Sewing Pin Through Fabric.wav — WavJunction.com | [Freesound](https://freesound.org/people/WavJunction.com/sounds/456772/) | [CC0](https://creativecommons.org/publicdomain/zero/1.0/)，官方高质量试听 MP3 收录于仓库 |
| 自行车 | Bicycle Pedalling Rolling Braking_01 — Rudmer_Rotteveel | [Freesound](https://freesound.org/people/Rudmer_Rotteveel/sounds/719482/) | CC0，官方高质量试听 MP3 收录于仓库 |
| 窗外环境 | Clark's Tower Ambience 1 RX.wav — greysound | [Freesound](https://freesound.org/people/greysound/sounds/547923/) | CC0，官方高质量试听 MP3 收录于仓库 |
| 光照环境 | Brown Photostudio 02 — Poly Haven | [素材页](https://polyhaven.com/a/brown_photostudio_02) / [许可](https://polyhaven.com/license) | CC0，1K HDR 收录于仓库 |

获取网址、实际文件大小与 SHA-256 见 [asset-sources.json](../public/asset-sources.json)。准备脚本逐个校验文件；官方内容若变化，脚本会停止而非悄悄替换。

## 声音编排

- 配乐取原曲 34–134 秒，按叙事调整音量并淡入淡出。
- 针穿布的录音瞬态对齐 19.50 秒和 22.40 秒的动作。
- 自行车录音覆盖 45–62 秒的三个连续镜头。
- 窗外鸟鸣是创作环境音，并非中国历史场景的现场录音。
- 部分卷布、收绳、升旗摩擦与布面风动，使用针线录音的摩擦声作为声音纹理，并非逐件重新录制。

声音脚本为 [audio-full.py](../scripts/audio-full.py)，事件表为 [full-events.json](../public/audio/full-events.json)，混音信号记录为 [mix-analysis.json](../public/audio/mix-analysis.json)。三个生成的 WAV 均留在本地，不随仓库分发。

## 使用范围

配乐遵循 Mixkit 官方许可与 [User Terms](https://mixkit.co/terms/)。其音乐许可列明网络/社交视频等使用方式，以及电视、广播、游戏等限制；成片的使用应同时考虑该配乐许可。仓库公开源码不改变第三方素材许可，也不授予对该曲目的所有权。

源码当前 `UNLICENSED`；没有将整个项目标记为 MIT 或将第三方素材声明为原创。
