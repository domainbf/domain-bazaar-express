
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { NotificationRequest } from '../utils/types.ts';

export async function createInAppNotification(
  supabaseAdmin: SupabaseClient,
  { recipient, type, data }: NotificationRequest,
  subject: string,
) {
  try {
    let notificationType = 'system';
    let notificationTitle = '系统通知';
    let actionUrl = '/user-center?tab=notifications';
    
    if (type.includes('offer')) {
      notificationType = 'offer';
      notificationTitle = '新的域名报价';
      actionUrl = '/user-center?tab=transactions';
    } else if (type.includes('verification')) {
      notificationType = 'verification';
      notificationTitle = '域名验证更新';
      actionUrl = '/user-center?tab=domains';
    } else if (type.includes('domain_')) {
      notificationType = 'transaction';
      notificationTitle = '域名交易更新';
      actionUrl = '/user-center?tab=transactions';
    }
    
    await supabaseAdmin.from('notifications').insert({
      user_id: recipient,
      title: data.title || notificationTitle,
      message: data.message || subject,
      type: notificationType,
      is_read: false,
      created_at: new Date().toISOString(),
      related_id: data.related_id,
      action_url: data.action_url || actionUrl
    });

    console.log(`Successfully created in-app notification for ${recipient}`);
  } catch (notifError) {
    console.error("Error creating notification:", notifError);
    // Continue even if notification fails
  }
}
