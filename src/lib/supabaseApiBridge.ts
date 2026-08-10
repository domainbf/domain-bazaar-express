/**
 * Supabase 桥接层
 *
 * 后台管理面板原本调用 Express/Turso API（/api/data/...），但本项目在
 * Lovable / Vercel 预览环境中并没有运行该服务（返回 500），导致"所有管理
 * 功能都无法保存"。这里把这些接口直接映射到 Supabase，使读写落到与前台
 * 展示同一个数据库。
 *
 * 返回 NOT_HANDLED 时，apiClient 会继续走原来的网络请求（向后兼容）。
 */
import { supabase } from '@/integrations/supabase/client';

export const NOT_HANDLED = Symbol('NOT_HANDLED');

export interface BridgeResult {
  status: number;
  data: unknown;
}

type Json = Record<string, any>;

const ok = (data: unknown = { success: true }): BridgeResult => ({ status: 200, data });
const fail = (message: string, status = 400): BridgeResult => ({ status, data: { error: message } });

const throwIf = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const toStringValue = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
};

async function upsertSettings(kv: Json) {
  const rows = Object.entries(kv)
    .filter(([k]) => typeof k === 'string' && k.length > 0)
    .map(([key, value]) => ({ key, value: toStringValue(value) }));
  if (rows.length === 0) return fail('无可更新字段');
  const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
  throwIf(error);
  const { data } = await supabase.from('site_settings').select('key, value');
  const fresh: Json = {};
  (data ?? []).forEach((r: any) => { fresh[r.key] = r.value; });
  return ok(fresh);
}

async function domainNameMap(ids: (string | null)[]) {
  const unique = Array.from(new Set(ids.filter(Boolean))) as string[];
  if (unique.length === 0) return {} as Record<string, string>;
  const { data } = await supabase.from('domain_listings').select('id, name').in('id', unique);
  const map: Record<string, string> = {};
  (data ?? []).forEach((d: any) => { map[d.id] = d.name; });
  return map;
}

/**
 * @returns BridgeResult 或 NOT_HANDLED
 */
export async function handleViaSupabase(
  rawPath: string,
  method: string,
  body?: unknown,
): Promise<BridgeResult | typeof NOT_HANDLED> {
  const [pathname, search = ''] = rawPath.split('?');
  const query = new URLSearchParams(search);
  const seg = pathname.split('/').filter(Boolean); // ['data','admin','offers']
  const m = method.toUpperCase();
  const payload = (body ?? {}) as Json;

  if (seg[0] !== 'data') return NOT_HANDLED;
  const p = seg.slice(1); // 去掉 'data'

  // ---------- 站点设置 ----------
  if (p[0] === 'site-settings' && p.length === 1) {
    if (m === 'GET') {
      const { data, error } = await supabase.from('site_settings').select('key, value');
      throwIf(error);
      const out: Json = {};
      (data ?? []).forEach((r: any) => { out[r.key] = r.value; });
      return ok(out);
    }
    if (m === 'PATCH' || m === 'PUT') {
      const kv = (payload.updates && typeof payload.updates === 'object') ? payload.updates : payload;
      return upsertSettings(kv as Json);
    }
  }

  if (p[0] === 'admin' && p[1] === 'site-settings') {
    if (m === 'GET' && p.length === 2) {
      const { data, error } = await supabase
        .from('site_settings')
        .select('id, key, value, description, section, type, updated_at')
        .order('section', { ascending: true })
        .order('key', { ascending: true });
      throwIf(error);
      return ok(data ?? []);
    }
    if (m === 'POST' && p.length === 2) {
      const { key, value, section = 'general', type = 'text', description = '' } = payload;
      if (!key) return fail('缺少 key');
      const { data, error } = await supabase
        .from('site_settings')
        .upsert(
          { key, value: toStringValue(value), section, type, description },
          { onConflict: 'key' },
        )
        .select()
        .maybeSingle();
      throwIf(error);
      return ok(data ?? { key, value: toStringValue(value) });
    }
    if (m === 'DELETE' && p.length === 3) {
      const { error } = await supabase.from('site_settings').delete().eq('key', decodeURIComponent(p[2]));
      throwIf(error);
      return ok();
    }
  }

  if (p[0] === 'admin' && p[1] === 'seed-seo' && m === 'POST') {
    return upsertSettings({
      seo_title: payload.seo_title ?? '域见•你 — 精品域名交易平台',
      seo_description: payload.seo_description ?? '精选优质域名，安全托管交易，专业过户服务。',
      seo_keywords: payload.seo_keywords ?? '域名交易,域名购买,精品域名,域名出售',
      ...payload,
    });
  }

  // ---------- 报价 ----------
  if (p[0] === 'admin' && p[1] === 'offers' && m === 'GET') {
    const { data, error } = await supabase
      .from('domain_offers')
      .select('*')
      .order('created_at', { ascending: false });
    throwIf(error);
    const names = await domainNameMap((data ?? []).map((o: any) => o.domain_id));
    return ok((data ?? []).map((o: any) => ({ ...o, domain_name: names[o.domain_id] ?? '—' })));
  }

  if (p[0] === 'domain-offers') {
    if (m === 'GET' && p.length === 1) {
      const role = query.get('role');
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return fail('未登录', 401);
      const column = role === 'seller' ? 'seller_id' : 'buyer_id';
      const { data, error } = await supabase
        .from('domain_offers')
        .select('*')
        .eq(column, uid)
        .order('created_at', { ascending: false });
      throwIf(error);
      const names = await domainNameMap((data ?? []).map((o: any) => o.domain_id));
      return ok((data ?? []).map((o: any) => ({ ...o, domain_name: names[o.domain_id] ?? '—' })));
    }
    if (m === 'PATCH' && p.length === 2) {
      const { error } = await supabase
        .from('domain_offers')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', p[1]);
      throwIf(error);
      return ok();
    }
    if (m === 'DELETE' && p.length === 2) {
      const { error } = await supabase.from('domain_offers').delete().eq('id', p[1]);
      throwIf(error);
      return ok();
    }
  }

  // ---------- 交易 ----------
  if (p[0] === 'admin' && p[1] === 'transactions') {
    if (m === 'GET' && p.length === 2) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      throwIf(error);
      const names = await domainNameMap((data ?? []).map((t: any) => t.domain_id));
      return ok((data ?? []).map((t: any) => ({ ...t, domain_name: names[t.domain_id] ?? '—' })));
    }
    if (m === 'PATCH' && p.length === 3) {
      const { status, notes, domain_id } = payload;
      const update: Json = { updated_at: new Date().toISOString() };
      if (status !== undefined) update.status = status;
      if (notes !== undefined) update.notes = notes;
      if (status === 'completed') update.completed_at = new Date().toISOString();
      const { error } = await supabase.from('transactions').update(update).eq('id', p[2]);
      throwIf(error);
      if (domain_id) {
        if (status === 'completed') {
          await supabase.from('domain_listings').update({ status: 'sold' }).eq('id', domain_id);
        } else if (status === 'cancelled' || status === 'refunded') {
          await supabase.from('domain_listings').update({ status: 'available' }).eq('id', domain_id);
        }
      }
      return ok();
    }
  }

  // ---------- 消息 ----------
  if (p[0] === 'admin' && p[1] === 'messages') {
    if (m === 'GET' && p.length === 2) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      throwIf(error);
      const names = await domainNameMap((data ?? []).map((x: any) => x.domain_id));
      return ok((data ?? []).map((x: any) => ({ ...x, domain_name: names[x.domain_id] ?? '—' })));
    }
    if (m === 'DELETE' && p.length === 3) {
      const { error } = await supabase.from('messages').delete().eq('id', p[2]);
      throwIf(error);
      return ok();
    }
  }

  // ---------- 评价 ----------
  if (p[0] === 'admin' && p[1] === 'reviews') {
    if (m === 'GET' && p.length === 2) {
      const { data, error } = await supabase
        .from('user_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
      throwIf(error);
      return ok((data ?? []).map((r: any) => ({ ...r, is_visible: !r.reported })));
    }
    if (m === 'PATCH' && p.length === 3) {
      const update: Json = {};
      if (payload.is_visible !== undefined) update.reported = !payload.is_visible;
      if (payload.comment !== undefined) update.comment = payload.comment;
      const { error } = await supabase.from('user_reviews').update(update).eq('id', p[2]);
      throwIf(error);
      return ok();
    }
    if (m === 'DELETE' && p.length === 3) {
      const { error } = await supabase.from('user_reviews').delete().eq('id', p[2]);
      throwIf(error);
      return ok();
    }
  }

  // ---------- 拍卖 ----------
  if (p[0] === 'admin' && p[1] === 'auctions') {
    if (m === 'GET' && p.length === 2) {
      const { data, error } = await supabase
        .from('domain_auctions')
        .select('*')
        .order('created_at', { ascending: false });
      throwIf(error);
      const names = await domainNameMap((data ?? []).map((a: any) => a.domain_id));
      return ok((data ?? []).map((a: any) => ({
        ...a,
        start_price: a.starting_price,
        bid_count: a.total_bids ?? 0,
        buy_now_price: a.reserve_price ?? null,
        domain_name: names[a.domain_id] ?? '—',
      })));
    }
    if (m === 'PATCH' && p.length === 3) {
      const { error } = await supabase.from('domain_auctions').update(payload).eq('id', p[2]);
      throwIf(error);
      return ok();
    }
    if (m === 'GET' && p.length === 4 && p[3] === 'bids') {
      const { data, error } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('auction_id', p[2])
        .order('created_at', { ascending: false });
      throwIf(error);
      return ok(data ?? []);
    }
  }

  // ---------- 域名列表 ----------
  if (p[0] === 'domain-listings') {
    if (m === 'GET' && p.length === 1) {
      let q = supabase.from('domain_listings').select('*').order('created_at', { ascending: false });
      const status = query.get('status');
      const limit = query.get('limit');
      if (status) q = q.eq('status', status);
      if (limit) q = q.limit(Number(limit));
      const { data, error } = await q;
      throwIf(error);
      return ok(data ?? []);
    }
    if (m === 'POST' && p.length === 1) {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return fail('未登录', 401);
      const { data, error } = await supabase
        .from('domain_listings')
        .insert({ ...payload, owner_id: payload.owner_id ?? uid })
        .select()
        .maybeSingle();
      throwIf(error);
      return ok(data);
    }
    if (m === 'PATCH' && p.length === 2) {
      const { error } = await supabase.from('domain_listings').update(payload).eq('id', p[1]);
      throwIf(error);
      return ok();
    }
    if (m === 'DELETE' && p.length === 2) {
      const { error } = await supabase.from('domain_listings').delete().eq('id', p[1]);
      throwIf(error);
      return ok();
    }
  }

  if (p[0] === 'my-domains' && m === 'GET') {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return fail('未登录', 401);
    const { data, error } = await supabase
      .from('domain_listings')
      .select('*')
      .eq('owner_id', uid)
      .order('created_at', { ascending: false });
    throwIf(error);
    return ok(data ?? []);
  }

  // ---------- 资料 / 收藏 / 交易 ----------
  if (p[0] === 'profiles' && p.length === 2) {
    if (m === 'GET') {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', p[1]).maybeSingle();
      throwIf(error);
      return ok(data);
    }
    if (m === 'PATCH') {
      const { error } = await supabase.from('profiles').update(payload).eq('id', p[1]);
      throwIf(error);
      return ok();
    }
  }

  if (p[0] === 'favorites') {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return fail('未登录', 401);
    if (m === 'GET' && p.length === 1) {
      const { data, error } = await supabase.from('user_favorites').select('*').eq('user_id', uid);
      throwIf(error);
      return ok(data ?? []);
    }
    if (m === 'POST' && p.length === 1) {
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: uid, domain_id: payload.domain_id ?? payload.domainId });
      throwIf(error);
      return ok();
    }
    if (m === 'DELETE' && p.length === 2) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', uid)
        .eq('domain_id', p[1]);
      throwIf(error);
      return ok();
    }
  }

  if (p[0] === 'transactions') {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return fail('未登录', 401);
    if (m === 'GET' && p.length === 1) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
        .order('created_at', { ascending: false });
      throwIf(error);
      return ok(data ?? []);
    }
    if (m === 'GET' && p.length === 2) {
      const { data, error } = await supabase.from('transactions').select('*').eq('id', p[1]).maybeSingle();
      throwIf(error);
      return ok(data);
    }
    if (m === 'PATCH' && p.length === 2) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', p[1]);
      throwIf(error);
      return ok();
    }
  }

  if (p[0] === 'disputes' && m === 'POST') {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return fail('未登录', 401);
    const { data, error } = await supabase
      .from('disputes')
      .insert({ ...payload, initiator_id: uid })
      .select()
      .maybeSingle();
    throwIf(error);
    return ok(data);
  }

  // ---------- 品牌 Logo / Favicon 上传（直传 Supabase Storage） ----------
  if (p[0] === 'admin' && p[1] === 'upload-logo' && m === 'POST') {
    const dataUrl = String(payload.dataUrl || '');
    const mode = String(payload.mode || 'light');
    const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
    if (!match) return fail('图片数据格式无效');
    const contentType = match[1];
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ext = contentType.includes('png') ? 'png'
      : contentType.includes('svg') ? 'svg'
      : contentType.includes('webp') ? 'webp'
      : contentType.includes('icon') ? 'ico' : 'jpg';
    const path = `site/${mode}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('domain-logos')
      .upload(path, bytes, { contentType, upsert: true, cacheControl: '31536000' });
    if (error) return fail(error.message, 500);
    const { data: pub } = supabase.storage.from('domain-logos').getPublicUrl(path);
    const url = pub.publicUrl;
    const key = mode === 'dark' ? 'logo_dark_url' : mode === 'favicon' ? 'favicon_url' : 'logo_url';
    await supabase.from('site_settings').upsert([{ key, value: url }], { onConflict: 'key' });
    return ok({ url, success: true });
  }

  // ---------- 边缘函数代理 ----------
  if (p[0] === 'admin' && p[1] === 'change-password' && m === 'POST') {
    const { data, error } = await supabase.functions.invoke('admin-password', { body: payload });
    if (error) return fail(error.message, 500);
    return ok(data);
  }

  if (p[0] === 'admin' && p[1] === 'whois-test' && m === 'POST') {
    const { data, error } = await supabase.functions.invoke('whois-query', { body: payload });
    if (error) return fail(error.message, 500);
    return ok(data);
  }

  if (p[0] === 'admin' && p[1] === 'send-test-email' && m === 'POST') {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: payload.to,
        subject: '测试邮件 · 域见•你',
        html: '<p>这是一封来自后台的测试邮件，收到即表示邮件通道正常。</p>',
      },
    });
    if (error) return fail(error.message, 500);
    return ok(data ?? { success: true });
  }

  // ---------- 用户反馈 ----------
  if (p[0] === 'feedback' && p.length === 1 && m === 'POST') {
    const screenshots = Array.isArray(payload.screenshots) ? payload.screenshots as string[] : [];
    const subject = typeof payload.subject === 'string' && payload.subject ? `【${payload.subject}】\n` : '';
    const { error } = await supabase.from('user_feedback').insert({
      user_id: (payload.userId as string) || null,
      type: (payload.type as string) || 'other',
      content: `${subject}${payload.message ?? ''}`,
      contact: (payload.userEmail as string) || null,
      page_url: (payload.url as string) || null,
      attachment_url: screenshots[0] || null,
    });
    throwIf(error);
    return ok({ success: true });
  }

  if (p[0] === 'admin' && p[1] === 'feedback') {
    if (m === 'GET' && p.length === 2) {
      const limit = Number(query.get('limit') || 20);
      const offset = Number(query.get('offset') || 0);
      let q = supabase
        .from('user_feedback')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      const status = query.get('status');
      const type = query.get('type');
      if (status) q = q.eq('status', status);
      if (type) q = q.eq('type', type);
      const { data, error, count } = await q;
      throwIf(error);
      return ok({ items: data ?? [], total: count ?? 0 });
    }
    if (m === 'PATCH' && p.length === 3) {
      const patch: Json = {};
      if (payload.status !== undefined) patch.status = payload.status;
      if (payload.admin_note !== undefined) patch.admin_note = payload.admin_note;
      const { error } = await supabase.from('user_feedback').update(patch).eq('id', p[2]);
      throwIf(error);
      return ok({ success: true });
    }
    if (m === 'DELETE' && p.length === 3) {
      const { error } = await supabase.from('user_feedback').delete().eq('id', p[2]);
      throwIf(error);
      return ok({ success: true });
    }
  }

  return NOT_HANDLED;
}
