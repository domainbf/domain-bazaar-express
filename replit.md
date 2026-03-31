# NIC.RW / 域见·你 — 中文域名交易平台

## 项目概述
专业域名交易平台，支持域名浏览、报价、还价、成交全流程。

## 技术架构
- **前端**: Vite + React 18 + TypeScript + Shadcn/UI + Tailwind
- **后端**: Hono (Node.js) API 服务器 (port 3001)
- **主数据库**: Turso (libSQL) — 所有结构化数据
- **缓存/会话**: Redis (Upstash)
- **文件存储**: Vercel Blob
- **辅助**: Supabase (支持工单、部分管理员复杂查询)
- **邮件**: nodemailer（真实 SMTP）+ Resend API 备选，统一通过 `server/mailer.ts`

## 测试账号
- **管理员**: 9208522@qq.com / admin888
- **卖家**: 654944262@qq.com / user888  
- **买家**: buyer@test.com / buyer888

## 最近变更记录
- **DomainValuationTool 全面升级**：完整重写 `DomainValuationTool.tsx`；新增 SVG 评分环（动画）、三步加载动画、6 个快速示例域名、localStorage 历史记录（最近 5 条）、域名特征标签（纯字母/吉祥数字/热词等）、六维评分+动态生成分析文本、专业建议列表、平台实盘参考（Hono API）、一键复制报告；Supabase edge function → 本地算法智能降级；`ValuationPage.tsx` 同步更新（Hero+功能格+FAQ）
- `POST /api/data/domain-views/:id` 新增浏览量记录接口（修复域名详情页控制台报错）
- 货币换算组件：去掉"汇率来源：Frankfurter"展示文字
- FAQ 页面：从 12 条扩展至 35 条，新增分类筛选（平台介绍/交易流程/域名验证/域名竞拍/费用/账户/纠纷）
- 隐私政策（PrivacyPage）：扩充至 11 大章节，含 PIPL/KYC/Cookie/数据保留/跨境传输等
- 用户服务协议（TermsPage）：扩充至 13 大章节，含资金托管、竞拍规则、禁止行为、知识产权等
- 免责声明（DisclaimerPage）：扩充至 10 大章节，含投资风险、估值免责、服务中断、知识产权风险等

## 已验证功能 (32/32 全部通过)
1. ✅ 用户登录/注册/找回密码
2. ✅ 域名市场浏览、搜索、分类筛选
3. ✅ 域名详情页（含价格历史、相似域名、卖家信息）
4. ✅ 域名收藏/取消收藏
5. ✅ 提交报价（含邮件通知卖家&买家）
6. ✅ 卖家查看收到的报价
7. ✅ 卖家还价（含邮件通知买家）
8. ✅ 买家接受/拒绝报价（含邮件通知）
9. ✅ 创建交易记录
10. ✅ 站内消息系统
11. ✅ 通知系统
12. ✅ 用户中心（我的域名、交易记录、个人资料）
13. ✅ 管理后台统计
14. ✅ 管理员修改密码
15. ✅ 管理后台设置 CRUD
16. ✅ 发送测试邮件
17. ✅ 联系表单邮件

## API 路由
### 公开
- GET /api/data/domain-listings — 域名列表 (支持 status/search/category/limit/offset)
- GET /api/data/domain-listings/:id — 域名详情
- GET /api/data/domain-listings/:id/detail — 域名完整详情
- GET /api/data/site-settings — 站点配置
- POST /api/data/domain-offers — 提交报价 (无需登录)
- POST /api/data/contact-email — 联系表单
- POST /api/auth/login — 登录
- POST /api/auth/register — 注册
- POST /api/auth/request-reset — 请求密码重置

### 需要登录
- GET/POST /api/data/domain-offers — 报价管理
- PATCH /api/data/domain-offers/:id — 更新报价状态
- GET/POST /api/data/messages — 消息
- GET/POST /api/data/transactions — 交易记录
- GET/POST /api/data/favorites — 收藏
- GET /api/data/notifications — 通知
- GET /api/data/my-domains — 我的域名
- GET /api/data/profiles/:id — 用户资料

### 管理员
- GET /api/data/admin/stats — 统计数据
- POST /api/data/admin/change-password — 修改密码
- GET/POST/DELETE /api/data/admin/site-settings — 设置管理
- POST /api/data/admin/send-test-email — 测试邮件
- POST /api/data/admin/whois-test — WHOIS 查询

## 品牌与外观设置 (SiteConfig)
新增字段（均在 `useSiteSettings.ts` SiteConfig 类型中）：
- `logo_dark_url` — 深色模式 Logo URL（空则用 logo_url）
- `site_subtitle` — 副标题（页脚品牌列显示）
- `icp_number` — ICP备案号（页脚底部显示，点击跳转工信部）
- `social_github/twitter/wechat/weibo` — 社交媒体链接（页脚图标）
- 后台管理路径：管理面板 → 系统设置 → **品牌与外观** Tab
- Logo 上传接口：`POST /api/data/admin/upload-logo`（multipart，字段 `file` + `mode: 'light'|'dark'`）

## 用户中心布局
- **桌面**：左侧 240px 固定边栏（头像+用户信息+mini统计行+分组导航），右侧内容区
- **边栏导航分组**：资产管理（我的域名/交易记录）、消息中心（站内消息/消息通知）、账户（个人资料/联系支持）
- **支持 Tab** 在桌面导航中可直接点击（原仅限移动端）

## Navbar
- 根据当前主题（light/dark）自动切换 Logo：深色模式时优先使用 `logo_dark_url`

## 重要架构约定
- **货币符号**: 全站统一使用 `¥`（不用 `$`）
- **通知 actionUrl**: 一律使用 `/user-center?tab=transactions`（`received-offers`/`sent-offers` 均为无效 tab）
- **创建交易**: `POST /data/transactions` 需由卖家调用，必须在 body 显式传 `buyer_id` 和 `seller_id`（服务端 `sub` 只作备选 buyer_id）
- **DomainForm disabled 检查**: 使用 `editingDomain != null`（宽松比较，防 undefined 漏过）
- **FavoriteDomains**: 使用 `domain_listings:domain_id` join（勿改回 `domains:domain_id`）
- **SentOffersTable**: 必须传 `onRefresh` prop 给父组件
- **Logo 上传**: 通过 `POST /data/admin/upload-logo` 上传到 Vercel Blob，自动写入 `site_settings`

## Vercel 部署适配
- `vercel.json` 所有路由配置完整（`/api/*` → `api/index.ts`，SPA fallback）
- `api/index.ts` 完整 Hono app，支持认证、上传（multipart）、SSE、websocket
- API 函数 `maxDuration: 60s`，`memory: 1024MB`
- API 路由添加了 `no-store` 缓存头避免 CDN 缓存

## 数据库初始化 (server/db.ts)
`initDb()` 通过 `CREATE TABLE IF NOT EXISTS` 确保以下表存在：
`app_auth_users`, `app_sessions`, `user_feedback`, `site_settings`, `domain_listings`, `domain_analytics`, `domain_offers`, `transactions`, `payment_transactions`, `disputes`
（`user_profiles` 已移除，为孤立表，所有用户数据统一存于 `profiles`）

## 连接优化 (server/index.ts + server/redis.ts)
- **Keep-alive**: Turso 每4分钟 / Redis 每3分钟发送 ping 防止冷启动
- **gzip 压缩**: `hono/compress` 中间件对所有响应启用 gzip/deflate
- **Redis 重连**: 指数退避策略 (300ms → 600ms → max 3000ms)，max 5次
- **TCP KeepAlive**: Redis 连接 `keepAlive: 30_000` 防止静默断开
- **缓存容错**: `cacheGet/cacheSet/cacheDel` 加 try/catch，Redis 离线时 degrade gracefully
- **新增 `cacheGetOrSet`**: Stale-while-revalidate 模式，先返回旧缓存再后台刷新

## 缓存 TTL 优化 (server/routes/data.ts)
- `site_settings`: 60s → 600s fresh + 300s stale (cacheGetOrSet)
- `domain_listings`: 60s → 90s
- `domain_listing/:id`: 120s → 180s
- `admin_stats`: 新增 120s 缓存，支持 `?refresh=1` 强制刷新

## 健康检查端点 (GET /api/health)
返回 `{ ok, redis, redisLatencyMs, db, dbLatencyMs, uptime }`，管理后台每30秒自动轮询展示实时状态

## 前端优化
- **useSiteSettings**: 从 Supabase 改为 `apiGet('/data/site-settings')`（重大修复：全站曾显示默认占位文字）
- **React Query**: 智能 retry（跳过401/403/404），指数退避 retryDelay，`refetchOnReconnect: true`
- **GlobalBottomNav**: 在 `/admin` 路径下自动隐藏，避免与后台自有导航冲突
- **移动端管理后台**: UserManagement 表格添加 `overflow-x-auto min-w-[700px]`
- **首页筛选器**: 添加 `scrollbar-hide` + 右侧渐变提示可滑动

## 管理后台修复记录
- **admin stats**: 视图数从 `domain_listings.views` 改为 `domain_analytics.views`；各查询用 `safe()` 包裹防单表故障崩溃
- **site_settings PATCH**: 改为 SELECT-then-UPDATE/INSERT 模式（原 ON CONFLICT 在无 UNIQUE 约束时报错）
- **SiteSettings.tsx**: 删除 Supabase 调用 (loadSmtpConfig/loadContactConfig/loadBrandConfig/loadWhoisConfig/loadModelScopeConfig)，统一改为 `apiGet('/data/site-settings')`
- **移动端 tabs**: 从 `flex-wrap` 改为横向滚动 `overflow-x-auto`
- **AdminDashboard 系统状态面板**: 从静态硬编码改为实时 `/api/health` 数据，显示 DB/Redis 延迟和进程运行时长

## 邮件发送架构 (server/mailer.ts)
统一邮件模块，两路由（data.ts / auth.ts）共享同一逻辑：
- **优先级 1 — 真实 SMTP**：`smtp_host` + `smtp_username` + `smtp_password` 均配置时，通过 nodemailer 发送，支持 QQ邮箱、163、Gmail、Outlook、Resend SMTP 等任意服务商
  - port 465 → TLS 加密；port 587/25 → STARTTLS
- **优先级 2 — Resend API**：SMTP 未配置但设置了 `resend_api_key`（或仅有 `smtp_password`）时，直接调 Resend HTTP API
- **未配置**：打印警告，不抛出异常，不影响其他业务
- `testMailConfig()` 函数：支持携带 override 参数测试未保存的配置；返回 `{ ok, provider, error? }`
- 后台"发送测试邮件"现在会展示实际使用的服务商名称

## 安全加固记录 (2026-03)
- **邮箱格式验证**: `/register` 端点新增 RFC 格式校验 + 254字符长度限制 + 密码128字符上限
- **速率限制**: `/crash-report` 5次/5分钟/IP（静默丢弃），`/feedback` 5次/10分钟/IP（返回429）
- **Redis SCAN**: `invalidateDomainListCache` 从 `redis.keys()` O(N) 阻塞调用改为 SCAN 分页
- **密码重置邮件**: `baseUrl` 从硬编码 `https://nic.rw` 改为读取 `site_settings.site_domain`
- **服务端 navigator 移除**: crash-report HTML 模板中的 `navigator?.userAgent` 已删除（服务端无 navigator）
- **邮件发件源统一**: `auth.ts` 改为读取 `site_settings`（而非旧 `smtp_settings` 表），与 `data.ts` 保持一致
- **硬编码域名规范**: 所有 fallback 邮箱统一使用 `noreply@nic.rw` / `domain@nic.rw`（正式域名）
- **反馈内容长度限制**: message ≤ 5000字，subject ≤ 200字

## 已知限制
- 支持工单系统使用 Supabase (设计如此)
- 管理面板部分查询使用 Supabase (AllDomainListings 等)
- 登录速率限制: 同一IP 10次/15分钟
