你列了很多点，我把它们分成四个可执行的迭代，每个迭代都能独立发布，避免一次改动过大失控。你确认后，我会按顺序推进；也可以指定「只做某几个模块」。

## 迭代 1 · 搜索与首页（高优先级）
- 首页 Hero 搜索框：放大到 h-16、圆角胶囊、内置 TLD 快切、加载中骨架。
- 智能建议：输入时下拉展示「精确匹配 / 同名多后缀 / AI 拼写纠正 / 相关关键词」，命中已上架域名直接标价。
- 批量检查：支持一次粘贴多个域名（换行/逗号分隔），走 `check-domain-availability` 边缘函数并列出可购/已售/不可注册状态。
- 价格对比条：搜索结果卡片右侧显示「本站 vs 参考市价」，参考价来自 `domain_valuations`。

## 迭代 2 · 域名仪表盘（Launchpad + 强表格）
- `MyDomainsPage` 换成 TanStack Table：列可拖拽显示/隐藏、状态/后缀/价格过滤、批量选择工具条（改价、下架、发起拍卖、导出 CSV）。
- 右侧详情抽屉：点击行不跳转，直接抽屉里展示价格历史、报价、访问统计、DNS 摘要、快速编辑。
- Launchpad 首屏可自定义模块：已有的 Launchpad 增加「拖拽排序 + 显示/隐藏」的持久化到 `profiles.launchpad_layout`（新增 JSONB 列）。

## 迭代 3 · 信任与结账
- 信任模块：首页与详情页加入「安全托管 / SSL / 平台评价 / 交易量」条带，评价来源 `user_reviews`，加平均分与最新 3 条。
- 透明定价：详情页价格块下方列出「域名价 + 平台费 + 托管费 + 合计」。
- 结账向导重构：4 步（确认 → 支付方式 → 支付 → 完成）用 stepper 组件，右侧一直显示订单摘要，移动端改为底部粘性摘要 + 全屏步骤。
- 订单确认页加二次确认 dialog（金额、买卖双方、域名）。

## 迭代 4 · DNS / 卖家中心 / 估值 / 移动端
- DNS 编辑器：`dns_records` 表基础上做行内编辑、类型下拉 (A/AAAA/CNAME/MX/TXT/NS)、TTL 校验、传播检查（调 DoH 多节点）。
- 卖家中心：新增销售统计图（30/90 天成交额、转化率、Top 询盘域名）+ 消息中心侧栏未读徽标。
- 估值工具：`domain-enhanced-evaluation` 输出加 AI 建议区块（定价建议、可选后缀、目标买家画像）。
- 移动端结账：粘性 CTA、单列步骤、大按钮 h-14。

## 技术细节
- 新建/改动主要文件：
  - `src/components/search/HeroSearch.tsx`、`src/components/search/BulkCheck.tsx`、`src/components/search/PriceCompare.tsx`
  - `src/pages/MyDomainsPage.tsx`（TanStack Table + Drawer）
  - `src/components/dashboard/DomainDetailDrawer.tsx`
  - `src/components/launchpad/LaunchpadGrid.tsx`（dnd-kit 已在项目里）
  - `src/components/trust/TrustBar.tsx`、`src/components/checkout/CheckoutWizard.tsx`
  - `src/components/dns/DnsEditor.tsx`、`src/components/dns/PropagationCheck.tsx`
  - `src/components/seller/SalesAnalytics.tsx`
- 数据库迁移：`profiles.launchpad_layout jsonb`、（若无）`user_reviews` 展示视图，不改现有结构。
- 复用现有：`useFavorites`、`useEnhancedSearch`、`routeTelemetry`、`OrderProgressTracker`。
- 全部走既有 shadcn tokens，不引入新色。

## 我需要你确认
1. 是否按 迭代 1 → 4 的顺序执行？还是想先做某一块（例如先做 DNS 编辑器 / 先做结账）？
2. 「批量检查」是否需要接第三方 WHOIS 判断可注册？还是只判断本站库内状态？
3. Launchpad 布局是否要保留「重置为默认」按钮和管理员统一模板？

回复后我立即开工。