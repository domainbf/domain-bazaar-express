
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { OfferRequest } from '../utils/types.ts';

export async function getDomainOwnerEmail(supabase: SupabaseClient, domainId: string): Promise<string | null> {
  try {
    const { data: domainData, error: domainError } = await supabase
      .from('domain_listings')
      .select(`
        *,
        profiles!inner(contact_email, username, full_name)
      `)
      .eq('id', domainId)
      .single();

    if (!domainError && domainData?.profiles?.contact_email) {
      return domainData.profiles.contact_email;
    } else if (domainData?.owner_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('contact_email')
        .eq('id', domainData.owner_id)
        .single();
      
      if (profileData?.contact_email) {
        return profileData.contact_email;
      }
    }
    return null;
  } catch (error) {
    console.error("获取域名所有者邮箱时出错:", error);
    return null;
  }
}

export async function storeOfferInDB(supabase: SupabaseClient, {
  domainId,
  offer,
  email,
  message,
  buyerId,
  domainOwnerId
}: OfferRequest) {
  const offerData = {
    domain_id: domainId,
    amount: parseFloat(offer),
    contact_email: email,
    message: message || null,
    buyer_id: buyerId || null,
    seller_id: domainOwnerId || null,
    status: 'pending'
  };

  const { error: insertError } = await supabase
    .from('domain_offers')
    .insert(offerData);

  if (insertError) {
    console.error("存储报价到数据库失败:", insertError);
    throw insertError;
  } else {
    console.log("报价成功存储到数据库");
  }
}

export async function createInAppNotifications(supabase: SupabaseClient, {
  domain,
  offer,
  domainId,
  domainOwnerId,
  buyerId,
}: OfferRequest) {
  try {
    const notifications = [];

    if (domainOwnerId) {
      notifications.push({
        user_id: domainOwnerId,
        title: '💰 新的域名报价',
        message: `您的域名 ${domain} 收到了 ¥${offer} 的新报价`,
        type: 'offer',
        related_id: domainId,
        action_url: '/user-center?tab=transactions'
      });
    }

    if (buyerId) {
      notifications.push({
        user_id: buyerId,
        title: '✅ 报价提交成功',
        message: `您对域名 ${domain} 的 ¥${offer} 报价已成功发送给卖家`,
        type: 'offer',
        related_id: domainId,
        action_url: '/user-center?tab=transactions'
      });
    }

    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error("创建通知时出错:", notifError);
      } else {
        console.log("应用内通知创建成功");
      }
    }
  } catch (notifError) {
    console.error("创建通知时出错:", notifError);
  }
}
