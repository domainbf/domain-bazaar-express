
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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

export async function saveOfferToDatabase(supabase: SupabaseClient, offerData: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('domain_offers')
      .insert({
        domain_id: offerData.domainId,
        amount: parseFloat(offerData.offer),
        contact_email: offerData.email,
        message: offerData.message || '',
        buyer_id: offerData.buyerId,
        seller_id: offerData.sellerId,
        status: 'pending'
      });

    if (error) {
      console.error("保存报价到数据库时出错:", error);
      throw new Error("数据库保存失败");
    }
    
    console.log("报价已成功保存到数据库");
  } catch (error) {
    console.error("保存报价失败:", error);
    throw error;
  }
}
