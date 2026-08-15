// 邮件发送统一入口：防重（dedupe_key 唯一索引）+ 指数退避重试 + 发送状态落库
// 所有状态写入 public.email_delivery_log，前端「通知设置」可展示最近一次发送状态。

export type DeliveryStatus = 'sent' | 'failed' | 'duplicate' | 'skipped';

export interface DeliverEmailArgs {
  userId?: string | null;
  to: string;
  subject: string;
  html: string;
  /** offer | kyc | transaction | message | dispute | system */
  emailType?: string;
  relatedId?: string | null;
  /** 稳定的业务去重键，例如 `offer:<id>:accepted` */
  dedupeKey: string;
  /** 去重窗口（毫秒），窗口内相同 key 不重复发送。默认 10 分钟 */
  dedupeWindowMs?: number;
  maxAttempts?: number;
  metadata?: Record<string, unknown>;
}

export interface DeliverEmailResult {
  status: DeliveryStatus;
  attempts: number;
  error?: string;
  reason?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 读取用户通知偏好，判断是否应发送该类型邮件 */
export async function shouldSendEmail(
  supabase: any,
  userId: string | null | undefined,
  emailType: string,
): Promise<{ allowed: boolean; reason?: string; frequency: string }> {
  if (!userId) return { allowed: true, frequency: 'instant' };
  const { data } = await supabase
    .from('profiles')
    .select('notification_prefs')
    .eq('id', userId)
    .maybeSingle();
  const prefs = (data?.notification_prefs ?? {}) as Record<string, unknown>;
  const frequency = String(prefs.email_frequency ?? 'instant');
  if (prefs.email_enabled === false) return { allowed: false, reason: 'email_disabled', frequency };
  const typeKey = `email_${emailType}`;
  if (typeKey in prefs && prefs[typeKey] === false) {
    return { allowed: false, reason: `${emailType}_disabled`, frequency };
  }
  return { allowed: true, frequency };
}

/**
 * 发送邮件（带防重与重试）。永不抛出，返回结果供调用方记录。
 */
export async function deliverEmail(
  supabase: any,
  args: DeliverEmailArgs,
): Promise<DeliverEmailResult> {
  const {
    userId = null,
    to,
    subject,
    html,
    emailType = 'system',
    relatedId = null,
    dedupeKey,
    dedupeWindowMs = 10 * 60 * 1000,
    maxAttempts = 3,
    metadata = {},
  } = args;

  // ── 1. 防重：窗口内已成功/正在发送的相同 key 直接跳过 ────────────────
  const since = new Date(Date.now() - dedupeWindowMs).toISOString();
  const { data: existing } = await supabase
    .from('email_delivery_log')
    .select('id, status, created_at')
    .eq('dedupe_key', dedupeKey)
    .maybeSingle();

  if (existing) {
    const fresh = existing.created_at >= since;
    if (fresh && existing.status !== 'failed') {
      return { status: 'duplicate', attempts: 0, reason: 'deduped' };
    }
    // 旧记录或上次失败 → 复用该行重新尝试
  }

  const logId: string | null = existing?.id ?? null;
  const baseRow = {
    user_id: userId,
    recipient: to,
    email_type: emailType,
    subject,
    dedupe_key: dedupeKey,
    related_id: relatedId,
    metadata,
    status: 'pending',
    attempts: 0,
    error: null,
    duration_ms: null,
  };

  let rowId = logId;
  if (rowId) {
    await supabase.from('email_delivery_log').update(baseRow).eq('id', rowId);
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from('email_delivery_log')
      .insert(baseRow)
      .select('id')
      .maybeSingle();
    if (insErr) {
      // 唯一索引冲突 = 并发重复请求
      if (String(insErr.message || '').includes('duplicate key')) {
        return { status: 'duplicate', attempts: 0, reason: 'concurrent' };
      }
      console.error('email log insert failed:', insErr.message);
    }
    rowId = inserted?.id ?? null;
  }

  // ── 2. 指数退避重试 ────────────────────────────────────────────────
  const started = Date.now();
  let lastError = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ to, subject, html }),
      });
      if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 300)}`);

      if (rowId) {
        await supabase.from('email_delivery_log').update({
          status: 'sent', attempts: attempt, error: null, duration_ms: Date.now() - started,
        }).eq('id', rowId);
      }
      return { status: 'sent', attempts: attempt };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error(`[email] attempt ${attempt}/${maxAttempts} failed for ${to}: ${lastError}`);
      if (rowId) {
        await supabase.from('email_delivery_log')
          .update({ attempts: attempt, error: lastError }).eq('id', rowId);
      }
      if (attempt < maxAttempts) await sleep(500 * Math.pow(2, attempt - 1));
    }
  }

  if (rowId) {
    await supabase.from('email_delivery_log').update({
      status: 'failed', attempts: maxAttempts, error: lastError, duration_ms: Date.now() - started,
    }).eq('id', rowId);
  }
  return { status: 'failed', attempts: maxAttempts, error: lastError };
}

/** 记录一条「按偏好跳过」的状态，便于前端展示 */
export async function logSkipped(
  supabase: any,
  args: Pick<DeliverEmailArgs, 'userId' | 'to' | 'subject' | 'emailType' | 'relatedId' | 'dedupeKey'> & { reason: string },
) {
  await supabase.from('email_delivery_log').upsert({
    user_id: args.userId ?? null,
    recipient: args.to,
    email_type: args.emailType ?? 'system',
    subject: args.subject,
    dedupe_key: args.dedupeKey,
    related_id: args.relatedId ?? null,
    status: 'skipped',
    attempts: 0,
    error: args.reason,
    metadata: { reason: args.reason },
  }, { onConflict: 'dedupe_key' });
}
