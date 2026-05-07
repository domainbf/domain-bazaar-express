
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

export async function getDomainOwnerEmail(supabase: SupabaseClient, domainId: string): Promise<string | null> {
  try {
    const { data: domainData } = await supabase
      .from('domain_listings')
      .select('owner_id')
      .eq('id', domainId)
      .maybeSingle();

    if (!domainData?.owner_id) return null;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('contact_email')
      .eq('id', domainData.owner_id)
      .maybeSingle();

    return profileData?.contact_email ?? null;
  } catch (error) {
    console.error("获取域名所有者邮箱时出错:", error);
    return null;
  }
}

/**
 * 在最近 5 分钟内查找重复报价（幂等性保护）
 * 匹配规则：相同 domain_id + 相同金额 + 相同币种 + (相同 buyer_id 或相同 contact_email)
 */
export async function findRecentDuplicateOffer(
  supabase: SupabaseClient,
  params: {
    domainId: string;
    amount: number;
    currency: string;
    buyerId?: string | null;
    email: string;
  }
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
      .limit(1);

    if (params.buyerId) {
      query = query.eq('buyer_id', params.buyerId);
    } else {
      query = query.eq('contact_email', params.email);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.warn('幂等性查重失败（继续创建）:', error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (e) {
    console.warn('幂等性查重异常（继续创建）:', e);
    return null;
  }
}

export async function saveOfferToDatabase(supabase: SupabaseClient, offerData: any): Promise<string> {
  const amount = parseFloat(offerData.offer);
  const currency = (offerData.currency || 'CNY').toUpperCase();

  // 幂等性：5 分钟内相同 (domain, buyer/email, amount, currency) 视为重复
  const dupId = await findRecentDuplicateOffer(supabase, {
    domainId: offerData.domainId,
    amount,
    currency,
    buyerId: offerData.buyerId,
    email: offerData.email,
  });
  if (dupId) {
    console.log('检测到重复报价，复用已有记录:', dupId);
    return dupId;
  }

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
      status: 'pending'
    })
    .select('id')
    .single();

  if (error) {
    console.error("保存报价到数据库时出错:", error);
    throw new Error(`数据库保存失败: ${error.message}`);
  }

  console.log("报价已成功保存到数据库, ID:", data.id);
  return data.id;
}

/** 回滚：删除指定报价记录（用于邮件失败时回滚 DB 写入） */
export async function deleteOffer(supabase: SupabaseClient, offerId: string): Promise<void> {
  try {
    const { error } = await supabase.from('domain_offers').delete().eq('id', offerId);
    if (error) console.error('回滚报价失败:', error.message);
    else console.log('已回滚报价记录:', offerId);
  } catch (e) {
    console.error('回滚报价异常:', e);
  }
}

export async function createOfferNotification(
  supabase: SupabaseClient,
  sellerId: string,
  domainName: string,
  offerAmount: number,
  offerId: string,
  buyerEmail: string,
  buyerId?: string | null,
  currency?: string
): Promise<void> {
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '¥';
  const formattedAmount = `${currencySymbol}${offerAmount.toLocaleString()}`;

  try {
    const { error: sellerNotifError } = await supabase
      .from('notifications')
      .insert({
        user_id: sellerId,
        title: `💰 收到新报价：${domainName}`,
        message: `您的域名 ${domainName} 收到了 ${formattedAmount} 的新报价，买家邮箱：${buyerEmail}`,
        type: 'offer',
        is_read: false,
        related_id: offerId,
        action_url: '/user-center?tab=transactions'
      });
    if (sellerNotifError) console.error("创建卖家通知失败:", sellerNotifError);

    if (buyerId) {
      const { error: buyerNotifError } = await supabase
        .from('notifications')
        .insert({
          user_id: buyerId,
          title: `✅ 报价已提交：${domainName}`,
          message: `您对域名 ${domainName} 提交了 ${formattedAmount} 的报价，卖家将会处理您的报价。`,
          type: 'offer',
          is_read: false,
          related_id: offerId,
          action_url: '/user-center?tab=transactions'
        });
      if (buyerNotifError) console.error("创建买家通知失败:", buyerNotifError);
    }
  } catch (error) {
    console.error("创建通知时出错:", error);
  }
}
