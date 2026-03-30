# NIC.BN / 域见·你 — 中文域名交易平台

## 项目概述
专业域名交易平台，支持域名浏览、报价、还价、成交全流程。

## 技术架构
- **前端**: Vite + React 18 + TypeScript + Shadcn/UI + Tailwind
- **后端**: Hono (Node.js) API 服务器 (port 3001)
- **主数据库**: Turso (libSQL) — 所有结构化数据
- **缓存/会话**: Redis (Upstash)
- **文件存储**: Vercel Blob
- **辅助**: Supabase (支持工单、部分管理员复杂查询)
- **邮件**: Resend API

## 测试账号
- **管理员**: 9208522@qq.com / admin888
- **卖家**: 654944262@qq.com / user888  
- **买家**: buyer@test.com / buyer888

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

## 已知限制
- 支持工单系统使用 Supabase (设计如此)
- 管理面板部分查询使用 Supabase (AllDomainListings 等)
- 登录速率限制: 同一IP 10次/15分钟
