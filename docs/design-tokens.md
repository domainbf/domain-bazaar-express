# 域见•你 — 全站设计令牌文档

所有颜色、阴影、圆角、间距均以语义 token 表达，禁止在组件中写死 `text-white` / `bg-black` / `bg-[#...]` / `text-blue-600` 等类名。
Token 定义源：`src/index.css`（HSL 变量） + `tailwind.config.ts`（Tailwind 映射）。

---

## 1. 配色（Color Tokens）

| Token | 用途 | Light | Dark |
| --- | --- | --- | --- |
| `background` / `foreground` | 页面底色与主文字 | `220 30% 98.5%` / `224 40% 10%` | `224 40% 6%` / `220 25% 96%` |
| `card` / `card-foreground` | 卡片表面 | `0 0% 100%` | `224 35% 9%` |
| `popover` / `popover-foreground` | 弹层表面 | `0 0% 100%` | `224 35% 9%` |
| `primary` / `primary-foreground` | 主行动色（深靛蓝 / 电光靛蓝） | `232 62% 32%` | `245 90% 70%` |
| `--primary-glow` | 渐变高光端 | `245 82% 62%` | `258 90% 75%` |
| `secondary` | 次级按钮/填充 | `220 20% 96%` | `224 25% 14%` |
| `muted` / `muted-foreground` | 弱化背景与辅助文字 | `220 18% 95%` / `220 12% 42%` | `224 25% 13%` / `220 15% 68%` |
| `accent` / `accent-foreground` | hover 与轻强调 | `245 80% 96%` | `245 60% 18%` |
| `destructive` | 危险/删除/失败 | `0 78% 55%` | `0 72% 58%` |
| `success` | 成功、已完成、已验证 | `152 62% 40%` | `152 68% 50%` |
| `warning` | 待处理、风险提示 | `32 88% 46%` | `38 92% 58%` |
| `info` | 中性信息、进行中 | `212 82% 48%` | `210 92% 66%` |
| `invert` / `invert-foreground` | 反色深底区块（头条卡、钱包、支付条） | `224 42% 8%` | `224 38% 5%` |
| `border` / `input` / `ring` | 描边、输入框、聚焦环 | `220 18% 90%` 等 | `224 25% 18%` 等 |
| `chart-1..5` | 图表序列色 | — | — |

**状态色语义约定**

- 成功 / 已支付 / 已验证 → `success`
- 待审核 / 待支付 / 即将过期 → `warning`
- 处理中 / 提示 / 链接态 → `info`
- 失败 / 驳回 / 删除 → `destructive`

## 2. 渐变与阴影

| Token | 值 |
| --- | --- |
| `--gradient-primary` | `linear-gradient(135deg, primary → primary-glow)`，Tailwind：`bg-gradient-primary` |
| `--gradient-hero` | 双径向 aurora，用于 `.page-hero::before` |
| `--shadow-card` | 卡片默认阴影，Tailwind：`shadow-card` |
| `--shadow-elegant` | hover / 抬升阴影，Tailwind：`shadow-elegant` |

## 3. 圆角

| Token | 值 | 用途 |
| --- | --- | --- |
| `--radius` (`rounded-lg`) | `0.75rem` | 按钮、输入框、普通卡片 |
| `rounded-md` | `calc(radius - 2px)` | 小控件、下拉项 |
| `rounded-sm` | `calc(radius - 4px)` | 徽标、tag |
| `rounded-2xl` | `1rem` | 域名卡片、premium 表面、弹窗 |
| `rounded-full` | — | 头像、心形收藏、eyebrow 药丸 |

## 4. 间距与节奏

| 场景 | 规范 |
| --- | --- |
| 页面容器 | `.page-container` = `max-w-6xl mx-auto px-4 md:px-8` |
| 区块纵向 | `py-12 md:py-16`（`<Section>` 默认） |
| Hero 纵向 | `py-12 md:py-16`；紧凑版 `py-8 md:py-10` |
| 卡片内边距 | `sm: p-4` / `md: p-5 md:p-6` / `lg: p-6 md:p-8` |
| 栅格间距 | `gap-4`（移动）/ `gap-6`（桌面） |
| 表单字段间距 | `space-y-4`；label 与控件 `space-y-1.5` |
| 标题与副标题 | `mb-8` 区块头，`mt-3` 副标题 |

## 5. 字体层级

| 层级 | 类名 |
| --- | --- |
| H1 / Hero | `text-3xl md:text-5xl font-bold tracking-tight` |
| H2 / 区块标题 | `.section-title` = `text-2xl md:text-3xl font-bold tracking-tight` |
| H3 / 卡片标题 | `text-lg font-semibold tracking-tight` |
| 正文 | `text-sm md:text-base text-foreground` |
| 辅助文字 | `.section-subtitle` = `text-sm md:text-base text-muted-foreground` |
| 说明 / 元信息 | `text-xs text-muted-foreground` |
| 域名字标 | `DomainWordmark`，大写 + 动态字号阶梯 |

移动端最小正文 `16px`（`html { font-size: 16px }` @ ≤640px），可点击元素最小高度 `44px`。

## 6. 布局组件（`src/components/layout/PageLayout.tsx`）

| 组件 | 作用 |
| --- | --- |
| `PageShell` | 页面根容器（`min-h-screen bg-background`） |
| `PageContainer` | 统一宽度容器 |
| `PageHero` | Hero：eyebrow / 标题 / 副标题 / 操作区 + 点阵与 aurora |
| `Section` | 区块，`tone`: default / muted / card / invert |
| `SectionHeading` | 区块标题 + 副标题 + 右侧操作 |
| `ContentCard` | 卡片，`tone`: default / glass / invert，`padding`: sm/md/lg |
| `TableShell` | 表格外壳（圆角、描边、横向滚动） |
| `ModalShell` | 弹窗内容节奏（标题/描述/内容/底部操作） |
| `EmptyState` | 统一空状态 |

页面结构基线：`Navbar` → `PageHero` → 若干 `Section` → `Footer`；移动端底部保留 `pb-20` 给 `GlobalBottomNav`。

## 7. 按钮规范

| 用途 | 写法 |
| --- | --- |
| 主操作 | `<Button>`（primary）或 `.primary-button` |
| 次操作 | `variant="secondary"` / `.secondary-button` |
| 轮廓 | `variant="outline"` / `.outline-button` |
| 危险 | `variant="destructive"` |
| 尺寸 | 默认 `h-10`；移动端主 CTA `h-11`；图标按钮 `h-9 w-9` |

## 8. 一致性检查

运行 `node scripts/design-audit.mjs`，输出报告到 `reports/design-consistency.md`：检测硬编码色板类、任意值颜色、容器宽度偏离、字体层级与卡片圆角/内边距偏差，并按页面汇总差异。
