# 02 · CSS 底层原理 —— 可交互示例

纯静态 HTML，内联 `<style>` / `<script>`，零 npm 依赖，双击即可打开（部分页面行为在 `file://` 下完全一致，无跨域依赖）。

## 运行方式

推荐使用静态服务器：

```bash
cd ai-frontend-interview/examples
python3 -m http.server 5500
# 浏览器打开 http://127.0.0.1:5500/02-css/<文件名>
```

## 文件 → 题号映射

| 文件 | 对应题号 | 演示内容 |
| --- | --- | --- |
| [b1-b2-box-model.html](./b1-b2-box-model.html) | CSS-B1 / B2 | content-box vs border-box 同参数对比，实时测量 content / 渲染宽高 / 含 margin 总占位；含文档 B2 原题数值表（200/20/5/10 → 250×150、270×170 等） |
| [b3-specificity.html](./b3-specificity.html) | CSS-B3 | 甲乙丙丁 4 条冲突规则的四元组 (a,b,c,d) 权值表与实际胜出者；一键叠加内联样式、给丙规则加 !important 观察层叠变化 |
| [i1-margin-collapse.html](./i1-margin-collapse.html) | CSS-I1 | 相邻兄弟 / 空块 / 父子三个分区，滑块调 margin（含负值）实测间距（正正取大 30px、正负相加 10px、负负取小）；BFC / padding / border 三种阻止手段 |
| [i2-bfc.html](./i2-bfc.html) | CSS-I2 | 三段可切换：浮动环绕 ↔ flow-root 两栏自适应、高度塌陷 ↔ BFC 清除浮动、父子 margin 合并 ↔ BFC 阻断 |
| [i3-positioning.html](./i3-positioning.html) | CSS-I3 | 后台骨架：fixed 导航、sticky 吸顶目录、static 长文、fixed/absolute 可切的客服 FAB + absolute 角标、relative 微调实验 |
| [a1-stacking-context.html](./a1-stacking-context.html) | CSS-A1 | z-index:9999 被子 z-index:2 盖住的经典复现（父 transform 形成层叠上下文），一键移除 transform 弹窗置顶；附七层绘制顺序与形成条件 |
| [a2-render-perf.html](./a2-render-perf.html) | CSS-A2 | 各 50 个方块：left/top（重排）vs transform（合成），rAF 实测 FPS / 帧耗时 / 长帧数；大模糊 box-shadow 与 will-change 层爆炸开关 |
| [a3-sticky-fallback.html](./a3-sticky-fallback.html) | CSS-A3 | CSS.supports 检测结果可视化、原生 sticky 吸顶 ↔ JS scroll+fixed 降级模拟开关，附 @supports / rAF 降级 / Browserslist 代码与两个失效陷阱 |

## 说明

- 所有示例均为暗色主题（背景 `#0b1220`，强调色 `#22d3ee` / `#a78bfa` / `#f97316`）。
- 页面顶部固定说明条标注对应题号；数字结论与 `docs/02-css.md` 参考答案一致。
- 尺寸/间距类演示的数据通过 `getBoundingClientRect()` / `getComputedStyle()` 实时读取，调整窗口或参数后自动刷新。
