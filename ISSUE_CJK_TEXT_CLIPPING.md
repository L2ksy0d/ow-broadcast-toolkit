# 中文粗体文字底部被裁切问题说明

## 环境

- 项目：`ow-broadcast-toolkit`
- 分支：`fix`
- 本地路径：`C:\Users\12572\Desktop\ow-broadcast-toolkit`
- 运行方式：本地 Vite / React 项目，通过控制台预览和 OBS Browser Source 播出 overlay 页面
- 典型输出尺寸：1920 x 1080
- 主要字体：播出 UI 使用高字重无衬线字体，中文环境下会落到 `HarmonyOS Sans SC` 等 CJK 字体

## 遇到的问题

在播出包装 UI 中，部分中文队伍名、选手名、标题使用粗体大字号显示时，文字底部会被裁切。

高频出现位置包括：

- 队伍阵容页的队伍名、选手名
- 流程包装 / 对阵页的标题和队伍名
- 结果页的胜者队伍名
- 感谢页的大标题
- 旧版首发阵容的队伍名、选手名、逐个 callout 文本
- 中场倒计时赛程卡片中的队伍名

表现为中文字符下缘缺失，例如粗体中文的底部横画、竖画尾端被截掉；英文大写通常不明显，因此问题在中文内容中更容易暴露。

## 排查定位

该问题不是图片资源、OBS 缩放或字体加载失败导致的，而是文本盒模型裁切导致的。

相关元素普遍同时满足以下条件：

- 使用大字号粗体：`font-weight: 900` 或 `950`
- 使用较低行高：例如 `line-height: 0.9`、`0.95`、`1.02`
- 使用单行截断布局：`white-space: nowrap`、`overflow: hidden`、`text-overflow: ellipsis`
- 内容可能是中文队名、中文选手名或中文标题

CJK 字形的垂直度量通常比英文字母更吃高度。当 `line-height` 低于字体实际需要的垂直空间时，文本行盒会压缩；再叠加 `overflow: hidden`，下缘就会被直接裁掉。

## 修复方案

对会承载用户输入中文内容的播出文本，将 `line-height` 提升到 `1.12`。

修复原则：

- 只修改动态中文文本可能出现的位置，例如队伍名、选手名、胜者名、标题
- 保留 `nowrap / ellipsis`，避免长队名破坏现有版式
- 不修改倒计时数字、背景描边英文、序号等装饰性元素，避免影响原本刻意压缩的视觉效果
- 对没有显式行高但同样使用 flex 居中和 ellipsis 的赛程列表队名，补充 `line-height: 1.12`

## 本次修改文件

- `src/scenes/roster/RosterScene.module.css`
- `src/scenes/matchup/MatchupScene.module.css`
- `src/scenes/thanks/ThanksScene.module.css`
- `src/scenes/result/ResultScene.jsx`
- `src/scenes/legacy-fcol/FriesStartingLineupScene.jsx`
- `src/scenes/countdown/CountdownScene.module.css`

## 预期结果

中文粗体队名、选手名、标题在对应播出场景中不再出现底部裁切；长文本仍然保持单行省略，不破坏整体导播包装布局。
