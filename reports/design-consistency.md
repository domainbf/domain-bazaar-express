# 页面风格一致性报告

生成时间: 2026-08-18T04:40:07.284Z
扫描文件: 318　问题总数: **0**

## 按规则汇总

| 规则 | 说明 | 数量 |
| --- | --- | --- |
| `palette-color` | 硬编码调色板颜色（应改用语义 token） | 0 |
| `arbitrary-color` | 任意值颜色 bg-[#...] / text-[#...] | 0 |
| `absolute-bw` | text-white / bg-white / bg-black / text-black | 0 |
| `container-width` | 容器宽度偏离 page-container(max-w-6xl) | 0 |
| `heading-scale` | 标题字号偏离层级（text-4xl+ 未走 Hero/section-title） | 0 |
| `card-radius` | 卡片圆角偏离（rounded-3xl / rounded-[..]） | 0 |
| `raw-shadow` | 原生阴影（应使用 shadow-card / shadow-elegant） | 0 |
| `inline-hex` | 内联样式中的十六进制颜色 | 0 |

## 按页面区域汇总

| 区域 | 数量 |
| --- | --- |

## Top 25 待整改文件

| 文件 | 数量 |
| --- | --- |

## 明细（前 300 条）

| 文件:行 | 规则 | 片段 |
| --- | --- | --- |

> 规范见 docs/design-tokens.md。修复方式：颜色改语义 token，容器改 `.page-container`，卡片/表格/弹窗改用 `src/components/layout/PageLayout.tsx` 中的原语。