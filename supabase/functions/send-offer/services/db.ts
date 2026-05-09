
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

export async function getDomainOwnerEmail(supabase: SupabaseClient, domainId: string): Promise<string | null> {
  try {
    const { data: domainData } = await supabase
      .from('domain_listings').select('owner_id').eq('id', domainId).maybeSingle();
    if (!domainData?.owner_id) return null;
    const { data: profileData } = await supabase
      .from('profiles').select('contact_email').eq('id', domainData.owner_id).maybeSingle();
    return profileData?.contact_email ?? null;
  } catch (error) {
    console.error("获取域名所有者邮箱时出错:", error);
    return null;
  }
}

/**
 * 5 分钟内查找重复报价（自动合并到首条）
 * 匹配：相同 domain_id + amount + currency + (buyer_id 或 contact_email)
 */
export async function findRecentDuplicateOffer(
  supabase: SupabaseClient,
  params: { domainId: string; amount: number; currency: string; buyerId?: string | null; email: string }
): Promise<string | null> {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    let query = supabase
      .from('domain_offers')
      .select('id')
      .eq('domain_id', params.domainId)
      .eq('amount', params.amount)
      .eq('currency', (params.currency || 'CNY').toUpperCase())
      .gte('created_at', fiveMinAgo)
      .order('created_at', { ascending: true })
      .limit(1);
    if (params.buyerId) query = query.eq('buyer_id', params.buyerId);
    else query = query.eq('contact_email', params.email);
    const { data, error } = await query.maybeSingle();
    if (error) { console.warn('幂等性查重失败（继续创建）:', error.message); return null; }
    return data?.id ?? null;
  } catch (e) {
    console.warn('幂等性查重异常（继续创建）:', e);
    return null;
  }
}

export async function incrementDuplicateCount(supabase: SupabaseClient, offerId: string): Promise<void> {
  try {
    const { data: cur } = await supabase
      .from('domain_offers').select('duplicate_count').eq('id', offerId).maybeSingle();
    const next = ((cur as any)?.duplicate_count ?? 0) + 1;
    await supabase.from('domain_offers')
      .update({ duplicate_count: next, last_duplicate_at: new Date().toISOString() })
      .eq('id', offerId);
  } catch (e) { console.warn('递增重复计数失败:', e); }
}

export async function saveOfferToDatabase(supabase: SupabaseClient, offerData: any): Promise<string> {
  const amount = parseFloat(offerData.offer);
  const currency = (offerData.currency || 'CNY').toUpperCase();
  const { data, error } = await supabase
    .from('domain_offers')
    .insert({
      domain_id: offerData.domainId,
      amount,
      currency,
      contact_email: offerData.email,
      message: offerData.message || '',
      buyer_id: offerData.buyerId,
      seller_id: offerData.sellerId,
      status: 'pending',
      idempotency_key: offerData.idempotencyKey || null,
    })
    .select('id').single();
  if (error) { console.error("保存报价到数据库时出错:", error); throw new Error(`数据库保存失败: ${error.message}`); }
  return data.id;
}

export async function deleteOffer(supabase: SupabaseClient, offerId: string): Promise<void> {
  try {
    const { error } = await supabase.from('domain_offers').delete().eq('id', offerId);
    if (error) console.error('回滚报价失败:', error.message);
  } catch (e) { console.error('回滚报价异常:', e); }
}

/** 写入审计日志 */
export async function recordAuditLog(supabase: SupabaseClient, log: {
  offerId?: string | null;
  domainId?: string | null;
  buyerId?: string | null;
  sellerId?: string | null;
  eventType: 'submitted' | 'duplicate_hit' | 'email_sent' | 'email_failed_rollback' | 'db_error' | 'validation_failed';
  idempotencyKey?: string | null;
  emailStatus?: string | null;
  emailError?: string | null;
  rollbackReason?: string | null;
  duplicateOf?: string | null;
  amount?: number | null;
  currency?: string | null;
  contactEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabase.from('offer_audit_logs').insert({
      offer_id: log.offerId || null,
      domain_id: log.domainId || null,
      buyer_id: log.buyerId || null,
      seller_id: log.sellerId || null,
      event_type: log.eventType,
      idempotency_key: log.idempotencyKey || null,
      email_status: log.emailStatus || null,
      email_error: log.emailError || null,
      rollback_reason: log.rollbackReason || null,
      duplicate_of: log.duplicateOf || null,
      amount: log.amount ?? null,
      currency: log.currency || null,
      contact_email: log.contactEmail || null,
      ip_address: log.ipAddress || null,
      user_agent: log.userAgent || null,
      metadata: log.metadata || {},
    });
  } catch (e) {
    console.warn('写入审计日志失败:', e);
  }
}

export async function createOfferNotification(
  supabase: SupabaseClient,
  sellerId: string, domainName: string, offerAmount: number,
  offerId: string, buyerEmail: string, buyerId?: string | null, currency?: string
): Promise<void> {
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '¥';
  const formattedAmount = `${currencySymbol}${offerAmount.toLocaleString()}`;
  try {
    await supabase.from('notifications').insert({
      user_id: sellerId,
      title: `💰 收到新报价：${domainName}`,
      message: `您的域名 ${domainName} 收到了 ${formattedAmount} 的新报价，买家邮箱：${buyerEmail}`,
      type: 'offer', is_read: false, related_id: offerId,
      action_url: '/user-center?tab=transactions'
    });
    if (buyerId) {
      await supabase.from('notifications').insert({
        user_id: buyerId,
        title: `✅ 报价已提交：${domainName}`,
        message: `您对域名 ${domainName} 提交了 ${formattedAmount} 的报价，卖家将会处理您的报价。`,
        type: 'offer', is_read: false, related_id: offerId,
        action_url: '/user-center?tab=transactions'
      });
    }
  } catch (error) { console.error("创建通知时出错:", error); }
}
