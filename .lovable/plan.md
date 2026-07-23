# 补全清单（1、3、4、5、6）

按依赖关系分组并行推进。所有变更只碰对应模块，不动无关代码。

---

## 1. 支付回调签名校验 (Payment Callback Security)

**文件：** `supabase/functions/payment-callback/index.ts`

- 按 `gateway` 分派验签：
  - **PayPal**：调用 `https://api-m.paypal.com/v1/notifications/verify-webhook-signature`，需要 `PAYPAL_WEBHOOK_ID`（新 secret）。
  - **Alipay / WeChat**：读取 `payment_gateway_settings` 中已存的公钥/APIv3 密钥，做 RSA2 / AES-GCM 校验。
  - **Manual / test**：仅当调用者带 `x-internal-secret`（新 secret `INTERNAL_CALLBACK_SECRET`）时放行。
- 未通过验签直接 401，并写入 `order_operations_log`。
- 需要新增 secret：`PAYPAL_WEBHOOK_ID`、`INTERNAL_CALLBACK_SECRET`（`generate_secret`）。

---

## 3. KYC 证件上传 (Seller KYC)

**文件：** `src/components/seller/KycForm.tsx`

- 新增三个上传槽位：证件正面 / 反面 / 手持自拍。
- 上传到私有 bucket `kyc-documents`，路径 `${user.id}/${uuid}-${type}.jpg`。
- 表单提交时写入 `seller_kyc.id_front_url` / `id_back_url` / `id_selfie_url`（列已存在）。
- 状态回显：`rejected` 时展示审核意见 + 允许重新提交（更新原记录而非新建）。
- 校验：文件≤5MB、仅 image/*。

**DB：** 无需迁移（列已存在）。仅需确认 `kyc-documents` bucket 的 RLS —— 用户仅能读写自己 `user_id` 前缀路径，管理员可读全部（已在 AdminKycReview 里用 signedUrl）。

---

## 4. 争议中心 (Dispute Center)

**文件：**
- `src/pages/DisputePage.tsx`（重构）
- `src/components/disputes/DisputeDetailDialog.tsx`（新建）
- `supabase/functions/dispute-actions/index.ts`（新建，用于管理员裁决 + 通知）

功能：
- **买家**：创建争议时上传证据（复用 `uploadEvidence`），列表查看进度。
- **卖家**：收到争议 → 应答（文本 + 附件）→ 状态 `responded`。
- **管理员**：`AdminDisputes.tsx` 中裁决 `resolved_buyer` / `resolved_seller`，触发退款或释放资金记录到 `order_operations_log` + 通知双方。
- 实时订阅 `disputes` 表更新。

**DB migration：** `disputes` 表增列
- `evidence_urls text[] default '{}'`
- `seller_response text`
- `seller_response_at timestamptz`
- `resolution text`
- `resolved_at timestamptz`
- `resolved_by uuid`

RLS：买家/卖家/管理员可 SELECT 自己相关；买家 INSERT；卖家 UPDATE 应答字段；管理员 UPDATE 全部。

---

## 5. 消息中心实时化 (Message Center)

**文件：** `src/components/messages/MessageCenter.tsx`

- 使用 `useRealtimeSubscription(['messages'], ...)` 订阅新消息，接收方即时插入到当前会话或列表未读数 +1。
- 打开会话时批量 `update messages set is_read=true where sender_id=peer and receiver_id=me`。
- 未读徽章接入 `useUnreadMessages`（已存在）。
- 发送后本地乐观插入，失败回滚 + toast。

无需 DB 变更。仅需确保 `messages` 表已加入 `supabase_realtime` publication（若未加，migration 里 `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`）。

---

## 6. 交割闭环 (Order Handover)

**文件：**
- `src/pages/OrderDetailPage.tsx`（补交付确认按钮）
- `src/components/order/OrderProgressTracker.tsx`（阶段可点击提示）
- `supabase/functions/order-progress/index.ts`（新建）

流程：
- `paid → activated → transferred → completed`
- 卖家在 `activated` 阶段点击"我已推送过户"→ `transferred`。
- 买家在 `transferred` 阶段点击"确认收到"→ `completed`，触发 `domains.owner_id = buyer_id`（payment-callback 已做一部分，这里保证冪等），并给卖家结算入账 `payment_transactions`（type=`payout_credit`）。
- 每步写 `order_operations_log`，双向通知。
- 逾时保护：72h 未确认自动完成（放到 `keepalive` cron，本次仅埋 SQL 函数占位）。

**DB migration：**
- `transactions` 增列 `buyer_confirmed_at`, `seller_pushed_at`
- 创建 `public.credit_seller_on_completion(_txn_id uuid)` security definer 函数

---

## 执行顺序

1. 一次性 migration：`disputes` 扩列 + `transactions` 扩列 + `messages` realtime + `credit_seller` 函数。
2. 三个边缘函数并行创建：`dispute-actions`、`order-progress`、以及改造 `payment-callback`。
3. 前端 5 处改造并行：KycForm、DisputePage + Dialog、MessageCenter、OrderDetailPage、AdminDisputes。
4. 添加 2 个 secrets（`PAYPAL_WEBHOOK_ID` 让用户输入，`INTERNAL_CALLBACK_SECRET` 自动生成）。

## 说明（技术细节）

- 所有边缘函数复用现有 `getClaims()` 鉴权模板，管理员操作用 `is_admin` RPC 二次校验。
- 争议附件复用 `uploads` blob（已有 `apiFetch('/upload')`），无需新建 bucket。
- 消息实时通过现有 `realtimeClient` 抽象，不新建 channel。
- 支付验签失败一律返回 401 + 不改数据库状态，避免绕过。

预计变更：~10 文件新增/修改，1 migration，2 secrets。完成后 1/3/4/5/6 全部闭环。
