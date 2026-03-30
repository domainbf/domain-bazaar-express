import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DomainOffer } from "@/types/domain";
import { Check, X, Mail, AlertCircle, Clock, Package, CheckCircle2, XCircle, Loader2, ArrowRight, MessageSquare, DollarSign, ArrowLeftRight } from 'lucide-react';
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface ReceivedOffersTableProps {
  offers: DomainOffer[];
  onRefresh: () => Promise<void>;
}

function parseOfferMessage(offer: DomainOffer): { buyerMessage: string; counterAmount?: number; counterNote?: string } {
  if (offer.status === 'countered' && offer.message) {
    try {
      const parsed = JSON.parse(offer.message);
      if (typeof parsed === 'object' && parsed.counter_amount) {
        return {
          buyerMessage: parsed.buyer_message ?? '',
          counterAmount: Number(parsed.counter_amount),
          counterNote: parsed.counter_note ?? '',
        };
      }
    } catch { /* not JSON */ }
  }
  return { buyerMessage: offer.message ?? '' };
}

export const ReceivedOffersTable = ({ offers, onRefresh }: ReceivedOffersTableProps) => {
  const navigate = useNavigate();
  const { config } = useSiteSettings();
  const [processingOffers, setProcessingOffers] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; offerId: string;
    action: 'accepted' | 'rejected' | 'completed'; domainName: string;
  } | null>(null);
  const [counterDialog, setCounterDialog] = useState<{
    open: boolean; offer: DomainOffer;
  } | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [isCountering, setIsCountering] = useState(false);

  useEffect(() => {
    useRealtimeSubscription(
    ["domain_offers"],
    (_event) => { onRefresh?.(); },
    true
  );
    
  }, [onRefresh]);

  const handleOfferAction = async (offerId: string, action: 'accepted' | 'rejected' | 'completed') => {
    setProcessingOffers(prev => ({ ...prev, [offerId]: true }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('请先登录'); return; }

      const { data: offerData, error: fetchError } = await supabase
        .from('domain_offers')
        .select(`*, domain_listings(name, owner_id, currency)`)
        .eq('id', offerId).single();
      if (fetchError || !offerData) { toast.error('报价不存在'); return; }
      if (offerData.seller_id !== user.id) { toast.error('您没有权限处理此报价'); return; }

      // Only process offers that are in an actionable state (prevent double-process)
      const allowedStatuses: Record<typeof action, string[]> = {
        accepted: ['pending', 'countered'],
        rejected: ['pending', 'countered'],
        completed: ['buyer_confirmed'],
      };
      const currentStatus = offerData.status ?? '';
      if (!allowedStatuses[action]?.includes(currentStatus)) {
        toast.error('该报价当前状态无法执行此操作');
        return;
      }

      const { error: updateError } = await supabase
        .from('domain_offers')
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq('id', offerId).eq('seller_id', user.id)
        .in('status', allowedStatuses[action]);
      if (updateError) throw new Error(`更新失败: ${updateError.message}`);

      let newTransactionId: string | null = null;
      if (action === 'accepted' && offerData.buyer_id && offerData.domain_listings) {
        try {
          const { data: settingsData } = await supabase
            .from('site_settings').select('value').eq('key', 'commission_rate').maybeSingle();
          const commissionRate = parseFloat(settingsData?.value || '0.05');
          const amount = Number(offerData.amount);
          const commissionAmount = Math.max(amount * commissionRate, 10);
          const sellerAmount = amount - commissionAmount;

          // The transactions table FKs to 'domains', not 'domain_listings'.
          // Look up or create a 'domains' entry by name to get the correct FK id.
          const domainName = offerData.domain_listings.name;
          let domainsId: string | null = null;
          const { data: existingDomain } = await supabase
            .from('domains').select('id').eq('name', domainName).maybeSingle();
          if (existingDomain?.id) {
            domainsId = existingDomain.id;
          } else {
            const { data: newDomain } = await supabase.from('domains').insert({
              name: domainName, price: amount, status: 'available',
              owner_id: user.id, minimum_price: 0,
            }).select('id').single();
            domainsId = newDomain?.id ?? null;
          }

          if (!domainsId) {
            toast.error('域名记录查找失败，请联系客服');
          } else {
            const { data: txData, error: txError } = await supabase
              .from('transactions').insert({
                buyer_id: offerData.buyer_id, seller_id: user.id,
                domain_id: domainsId, offer_id: offerId,
                amount, status: 'payment_pending', payment_method: 'bank_transfer',
                commission_rate: commissionRate,
                commission_amount: commissionAmount, seller_amount: sellerAmount,
              }).select('id').single();

            if (txError) {
              console.error('Transaction creation error:', txError);
              toast.error('交易记录创建失败，请联系客服');
            } else if (txData) {
              newTransactionId = txData.id;
              await supabase.from('domain_offers')
                .update({ transaction_id: newTransactionId }).eq('id', offerId);
              // Mark domain as pending transaction (no longer freely available)
              if (offerData.domain_id) {
                await supabase.from('domain_listings')
                  .update({ status: 'pending' })
                  .eq('id', offerData.domain_id);
              }
            }
          }
        } catch (txErr) { console.error('Transaction creation error:', txErr); }
      }

      if (offerData.buyer_id && offerData.domain_listings) {
        const sym = offerData.domain_listings.currency === 'USD' ? '$' : '¥';
        const amt = `${sym}${Number(offerData.amount).toLocaleString()}`;
        const msgs: Record<string, string> = {
          accepted: `您对域名 ${offerData.domain_listings.name} 的 ${amt} 报价已被卖家接受！请进入交易详情完成付款。`,
          rejected: `您对域名 ${offerData.domain_listings.name} 的 ${amt} 报价已被拒绝，您可以尝试提交新的报价。`,
          completed: `域名 ${offerData.domain_listings.name} 的 ${amt} 交易已完成！感谢您使用我们的平台。`,
        };
        const titles: Record<string, string> = {
          accepted: '🎉 报价已接受', rejected: '❌ 报价已拒绝', completed: '✅ 交易已完成',
        };
        try {
          await supabase.from('notifications').insert({
            user_id: offerData.buyer_id,
            title: titles[action] ?? '报价状态更新',
            message: msgs[action],
            type: 'offer', related_id: offerId,
            action_url: newTransactionId ? `/transaction/${newTransactionId}` : '/user-center?tab=transactions',
          });
        } catch (e) { console.error('Notification error:', e); }
      }

      // Email to buyer for accept / reject
      if ((action === 'accepted' || action === 'rejected') && offerData.contact_email && offerData.domain_listings) {
        try {
          const siteDomain = (config.site_domain || window.location.origin).replace(/\/$/, '');
          const siteName = config.site_name || '域见•你';
          const siteHostname = siteDomain.replace(/^https?:\/\//, '').toUpperCase();
          const supportEmail = config.contact_email || `support@${siteDomain.replace(/^https?:\/\//, '')}`;
          const domainDisplay = (offerData.domain_listings.name || '').toUpperCase();
          const sym = offerData.domain_listings.currency === 'USD' ? '$' : '¥';
          const amt = `${sym}${Number(offerData.amount).toLocaleString()}`;
          const year = new Date().getFullYear();

          const txUrl = newTransactionId
            ? `${siteDomain}/transaction/${newTransactionId}`
            : `${siteDomain}/user-center?tab=transactions`;

          const isAccepted = action === 'accepted';

          const accentColor = isAccepted ? '#16a34a' : '#dc2626';
          const accentBg = isAccepted ? '#f0fdf4' : '#fef2f2';
          const icon = isAccepted ? '🎉' : '❌';
          const heading = isAccepted ? '报价已接受！' : '报价已被拒绝';
          const subheading = isAccepted
            ? '恭喜，卖家接受了您的报价，交易已启动'
            : '很遗憾，卖家未能接受您的报价';
          const bodyText = isAccepted
            ? `卖家已接受了您对域名 <strong>${domainDisplay}</strong> 的 <strong>${amt}</strong> 报价。请尽快进入交易详情完成付款，以锁定域名。`
            : `卖家对域名 <strong>${domainDisplay}</strong> 的 <strong>${amt}</strong> 报价未予接受。您可以调整价格后重新提交报价，或浏览其他可购买域名。`;
          const btnText = isAccepted ? '立即查看交易详情 →' : '返回查看报价记录 →';
          const previewText = isAccepted
            ? `🎉 恭喜！卖家接受了您对 ${domainDisplay} 的 ${amt} 报价`
            : `您对 ${domainDisplay} 的 ${amt} 报价已被拒绝`;

          const tipBlock = isAccepted
            ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#15803d;letter-spacing:1px;text-transform:uppercase;">接下来的步骤</p>
                <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                  <tr><td style="padding:3px 0;font-size:13px;color:#166534;"><span style="font-weight:700;margin-right:6px;">①</span>点击下方按钮进入交易详情</td></tr>
                  <tr><td style="padding:3px 0;font-size:13px;color:#166534;"><span style="font-weight:700;margin-right:6px;">②</span>按照提示完成付款（银行转账或其他方式）</td></tr>
                  <tr><td style="padding:3px 0;font-size:13px;color:#166534;"><span style="font-weight:700;margin-right:6px;">③</span>平台确认收款后启动域名过户</td></tr>
                </table>
              </div>`
            : `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#b91c1c;letter-spacing:1px;text-transform:uppercase;">温馨提示</p>
                <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                  <tr><td style="padding:3px 0;font-size:13px;color:#991b1b;"><span style="font-weight:700;margin-right:6px;">·</span>可尝试适当提高报价后重新提交</td></tr>
                  <tr><td style="padding:3px 0;font-size:13px;color:#991b1b;"><span style="font-weight:700;margin-right:6px;">·</span>域名仍在挂牌，随时可以再次报价</td></tr>
                  <tr><td style="padding:3px 0;font-size:13px;color:#991b1b;"><span style="font-weight:700;margin-right:6px;">·</span>如有疑问可联系平台客服协助协商</td></tr>
                </table>
              </div>`;

          const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${previewText}</title>
  <style>body{margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;}.preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;}</style>
</head>
<body>
  <span class="preheader">${previewText}</span>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;">
            <tr><td style="background:#0f172a;border-radius:12px;padding:10px 20px;">
              <span style="color:#f8fafc;font-size:20px;font-weight:800;letter-spacing:-0.5px;">${siteName}</span>
              <span style="color:#475569;font-size:11px;font-weight:600;margin-left:10px;letter-spacing:2px;text-transform:uppercase;">${siteHostname}</span>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.07),0 2px 4px -2px rgba(0,0,0,0.05);">
          <div style="height:4px;background:${accentColor};"></div>
          <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
            <div style="width:64px;height:64px;background:${accentBg};border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;">${icon}</div>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">${heading}</h1>
            <p style="margin:0;font-size:15px;color:#64748b;">${subheading}</p>
          </div>
          <div style="padding:32px 40px;">
            <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;border:1px solid #e2e8f0;">
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td style="padding-bottom:12px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">报价域名</p>
                    <p style="margin:0;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">${domainDisplay}</p>
                  </td>
                </tr>
                <tr><td style="border-top:1px solid #e2e8f0;padding-top:12px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">您的报价金额</p>
                  <p style="margin:0;font-size:28px;font-weight:900;color:${accentColor};letter-spacing:-1px;">${amt}</p>
                </td></tr>
              </table>
            </div>
            <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 24px;" >${bodyText}</p>
            ${tipBlock}
            <div style="text-align:center;padding-bottom:8px;">
              <a href="${txUrl}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 40px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(15,23,42,0.25);">${btnText}</a>
            </div>
          </div>
          <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:13px;color:#94a3b8;">有疑问？联系 <a href="mailto:${supportEmail}" style="color:#475569;text-decoration:none;font-weight:600;">${supportEmail}</a></p>
          </div>
        </td></tr>
        <tr><td style="padding:24px 20px 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">© ${year} ${siteName} · ${siteHostname} · All rights reserved</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

          const subject = isAccepted
            ? `🎉 报价已接受：${domainDisplay} — ${amt}`
            : `❌ 报价未被接受：${domainDisplay} — ${amt}`;

          supabase.functions.invoke('send-email', {
            body: { to: offerData.contact_email, subject, html },
          }).catch(e => console.error('Accept/reject email error:', e));
        } catch (e) { console.error('Email build error:', e); }
      }

      const actionText = action === 'accepted' ? '已接受' : (action === 'rejected' ? '已拒绝' : '已完成');
      toast.success(`报价${actionText}成功`);
      setConfirmDialog(null);
      await onRefresh();
      if (action === 'accepted' && newTransactionId) navigate(`/transaction/${newTransactionId}`);
    } catch (error: any) {
      console.error('Error updating offer:', error);
      toast.error(error.message || '更新报价状态失败');
    } finally {
      setProcessingOffers(prev => ({ ...prev, [offerId]: false }));
    }
  };

  const handleCounterOffer = async () => {
    if (!counterDialog) return;
    const amount = parseFloat(counterAmount.replace(/,/g, ''));
    if (!amount || amount <= 0) { toast.error('请输入有效的还价金额'); return; }

    setIsCountering(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('请先登录'); return; }

      const offer = counterDialog.offer;

      // Parse original buyer message
      const originalMessage = (() => {
        try {
          const parsed = JSON.parse(offer.message || '');
          return parsed.buyer_message ?? offer.message ?? '';
        } catch { return offer.message ?? ''; }
      })();

      // Encode counter-offer into the message field as JSON
      const encodedMessage = JSON.stringify({
        buyer_message: originalMessage,
        counter_amount: amount,
        counter_note: counterNote.trim(),
      });

      // 1. Update offer status + message (allow from pending or countered state)
      const { error: updateErr } = await supabase
        .from('domain_offers')
        .update({ status: 'countered', message: encodedMessage, updated_at: new Date().toISOString() })
        .eq('id', offer.id)
        .eq('seller_id', user.id)
        .in('status', ['pending', 'countered']);
      if (updateErr) throw updateErr;

      // 2. In-app notification for buyer
      if (offer.buyer_id) {
        const notifSym = (offer as any).domain_listings?.currency === 'USD' ? '$' : '¥';
        await supabase.from('notifications').insert({
          user_id: offer.buyer_id,
          title: '💬 卖家已还价',
          message: `域名 ${offer.domain_name} 的卖家对您 ${notifSym}${offer.amount.toLocaleString()} 的报价还价为 ${notifSym}${amount.toLocaleString()}，请登录查看并回复。`,
          type: 'offer',
          related_id: offer.id,
          action_url: '/user-center?tab=transactions',
        }).catch(e => console.error('Notification error:', e));
      }

      // 3. Email to buyer (via send-email edge function — no auth required)
      if (offer.contact_email) {
        const siteDomain = (config.site_domain || window.location.origin).replace(/\/$/, '');
        const siteName = config.site_name || '域见•你';
        const siteHostname = siteDomain.replace(/^https?:\/\//, '').toUpperCase();
        const supportEmail = config.contact_email || `support@${siteDomain.replace(/^https?:\/\//, '')}`;
        const domainDisplay = (offer.domain_name || '').toUpperCase();
        const offerSym = (offer as any).domain_listings?.currency === 'USD' ? '$' : '¥';
        const yourBid = `${offerSym}${offer.amount.toLocaleString()}`;
        const counterBid = `${offerSym}${amount.toLocaleString()}`;
        const noteBlock = counterNote.trim()
          ? `<div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#854d0e;letter-spacing:1px;text-transform:uppercase;">卖家备注</p>
              <p style="margin:0;font-size:14px;color:#713f12;font-style:italic;">"${counterNote.trim()}"</p>
            </div>`
          : '';

        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>卖家还价通知 — ${domainDisplay}</title>
  <style>body{margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;}.preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;}</style>
</head>
<body>
  <span class="preheader">卖家对 ${domainDisplay} 的报价做出了还价 ${counterBid}</span>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;">
            <tr><td style="background:#0f172a;border-radius:12px;padding:10px 20px;">
              <span style="color:#f8fafc;font-size:20px;font-weight:800;letter-spacing:-0.5px;">${siteName}</span>
              <span style="color:#475569;font-size:11px;font-weight:600;margin-left:10px;letter-spacing:2px;text-transform:uppercase;">${siteHostname}</span>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.07),0 2px 4px -2px rgba(0,0,0,0.05);">
          <div style="height:4px;background:linear-gradient(90deg,#0f172a 0%,#334155 50%,#64748b 100%);"></div>
          <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
            <div style="width:64px;height:64px;background:#eff6ff;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;">💬</div>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">卖家已还价</h1>
            <p style="margin:0;font-size:15px;color:#64748b;">卖家对您的报价做出了回应，请尽快查看</p>
          </div>
          <div style="padding:32px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
              <tr>
                <td style="background:#f8fafc;border-radius:12px;padding:24px;text-align:center;border:1px solid #e2e8f0;">
                  <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">洽谈域名</p>
                  <p style="margin:0;font-size:28px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">${domainDisplay}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;border-spacing:12px;border-collapse:separate;">
              <tr>
                <td style="background:#f1f5f9;border-radius:10px;padding:18px;text-align:center;width:50%;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">您的出价</p>
                  <p style="margin:0;font-size:22px;font-weight:800;color:#94a3b8;text-decoration:line-through;">${yourBid}</p>
                </td>
                <td style="background:#0f172a;border-radius:10px;padding:18px;text-align:center;width:50%;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#475569;letter-spacing:1px;text-transform:uppercase;">卖家还价</p>
                  <p style="margin:0;font-size:22px;font-weight:800;color:#f8fafc;">${counterBid}</p>
                </td>
              </tr>
            </table>
            ${noteBlock}
            <div style="background:#f8fafc;border-radius:10px;padding:20px;border-left:4px solid #0f172a;margin-bottom:28px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0f172a;">您可以选择：</p>
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr><td style="padding:3px 0;font-size:13px;color:#475569;"><span style="color:#0f172a;font-weight:700;margin-right:8px;">✓</span>接受卖家还价，直接完成交易</td></tr>
                <tr><td style="padding:3px 0;font-size:13px;color:#475569;"><span style="color:#0f172a;font-weight:700;margin-right:8px;">↺</span>提出新的反报价，继续协商</td></tr>
                <tr><td style="padding:3px 0;font-size:13px;color:#475569;"><span style="color:#0f172a;font-weight:700;margin-right:8px;">✕</span>拒绝还价，结束本次谈判</td></tr>
              </table>
            </div>
            <div style="text-align:center;padding-bottom:32px;">
              <a href="${siteDomain}/user-center?tab=transactions" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:16px 40px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(15,23,42,0.25);">查看报价并回复 →</a>
            </div>
          </div>
          <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:13px;color:#94a3b8;">有疑问？联系 <a href="mailto:${supportEmail}" style="color:#475569;text-decoration:none;font-weight:600;">${supportEmail}</a></p>
          </div>
        </td></tr>
        <tr><td style="padding:24px 20px 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} ${siteName} · ${siteHostname} · All rights reserved</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        supabase.functions.invoke('send-email', {
          body: {
            to: offer.contact_email,
            subject: `卖家还价通知：${offer.domain_name} — 还价 ${offerSym}${amount.toLocaleString()}`,
            html,
          },
        }).catch(e => console.error('Email error:', e));
      }

      toast.success('还价已发送，买家将收到站内通知和邮件');
      setCounterDialog(null);
      setCounterAmount('');
      setCounterNote('');
      await onRefresh();
    } catch (err: any) {
      console.error('Counter offer error:', err);
      toast.error(err.message || '还价发送失败');
    } finally {
      setIsCountering(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '待处理', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 dark:border-yellow-800', icon: <Clock className="h-3 w-3" /> };
      case 'countered':
        return { label: '已还价', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 dark:border-blue-800', icon: <ArrowLeftRight className="h-3 w-3" /> };
      case 'accepted':
        return { label: '已接受', className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 dark:border-green-800', icon: <CheckCircle2 className="h-3 w-3" /> };
      case 'rejected':
        return { label: '已拒绝', className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 dark:border-red-800', icon: <XCircle className="h-3 w-3" /> };
      case 'completed':
        return { label: '已完成', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 dark:border-blue-800', icon: <Package className="h-3 w-3" /> };
      case 'cancelled':
        return { label: '已取消', className: 'bg-muted text-muted-foreground border-border', icon: <XCircle className="h-3 w-3" /> };
      default:
        return { label: status, className: 'bg-muted text-muted-foreground border-border', icon: <AlertCircle className="h-3 w-3" /> };
    }
  };

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground font-medium">您还没有收到任何报价</p>
        <p className="mt-1 text-sm text-muted-foreground">当有买家对您的域名感兴趣时，报价会显示在这里</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* 移动端卡片视图 */}
        <div className="block lg:hidden space-y-4">
          {offers.map((offer) => {
            const statusConfig = getStatusConfig(offer.status);
            const isProcessing = processingOffers[offer.id];
            const parsed = parseOfferMessage(offer);

            return (
              <Card key={offer.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{offer.domain_name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>买家（匿名）</span>
                      </div>
                    </div>
                    <Badge className={`${statusConfig.className} gap-1`}>{statusConfig.icon}{statusConfig.label}</Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">买家报价</span>
                    <span className={`text-lg font-bold ${offer.status === 'countered' ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                      ${offer.amount.toLocaleString()}
                    </span>
                  </div>

                  {offer.status === 'countered' && parsed.counterAmount && (
                    <div className="flex items-center justify-between bg-blue-500/10 dark:bg-blue-950/30 rounded-lg px-3 py-2">
                      <span className="text-sm text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
                        <ArrowLeftRight className="h-3.5 w-3.5" />您的还价
                      </span>
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-400">${parsed.counterAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {parsed.buyerMessage && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">买家留言</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{parsed.buyerMessage}</p>
                    </div>
                  )}

                  {parsed.counterNote && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">您的还价备注</p>
                      <p className="text-sm bg-blue-500/10 dark:bg-blue-950/30 p-2 rounded text-blue-700 dark:text-blue-400">{parsed.counterNote}</p>
                    </div>
                  )}

                  {offer.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'accepted', domainName: offer.domain_name || '' })} className="flex-1" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}接受
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => { setCounterDialog({ open: true, offer }); setCounterAmount(String(Math.ceil(offer.amount * 1.2))); }}
                        className="flex-1" disabled={isProcessing}>
                        <ArrowLeftRight className="h-4 w-4 mr-1" />还价
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'rejected', domainName: offer.domain_name || '' })}
                        className="text-destructive hover:bg-destructive/10" disabled={isProcessing}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {offer.status === 'accepted' && (
                    <div className="flex flex-col gap-2 pt-2 border-t">
                      {offer.transaction_id && (
                        <Link to={`/transaction/${offer.transaction_id}`}>
                          <Button size="sm" className="w-full gap-1.5"><ArrowRight className="h-4 w-4" />进入交易详情</Button>
                        </Link>
                      )}
                      <Button size="sm" variant="outline"
                        onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'completed', domainName: offer.domain_name || '' })}
                        className="w-full" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Package className="h-4 w-4 mr-1" />}标记为已完成
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 桌面端表格视图 */}
        <div className="hidden lg:block overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">域名</th>
                <th className="text-left p-4 font-semibold">报价金额</th>
                <th className="text-left p-4 font-semibold">来自</th>
                <th className="text-left p-4 font-semibold">留言</th>
                <th className="text-left p-4 font-semibold">状态</th>
                <th className="text-left p-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {offers.map((offer) => {
                const statusConfig = getStatusConfig(offer.status);
                const isProcessing = processingOffers[offer.id];
                const parsed = parseOfferMessage(offer);

                return (
                  <tr key={offer.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-semibold">{offer.domain_name}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-lg font-bold ${offer.status === 'countered' ? 'line-through text-muted-foreground text-sm' : 'text-primary'}`}>
                          ${offer.amount.toLocaleString()}
                        </span>
                        {offer.status === 'countered' && parsed.counterAmount && (
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <ArrowLeftRight className="h-3 w-3" />还价 ${parsed.counterAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>买家（匿名）</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="space-y-1">
                        {parsed.buyerMessage ? (
                          <p className="text-sm text-muted-foreground truncate" title={parsed.buyerMessage}>{parsed.buyerMessage}</p>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">无留言</span>
                        )}
                        {parsed.counterNote && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 truncate flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 shrink-0" />{parsed.counterNote}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={`${statusConfig.className} gap-1`}>{statusConfig.icon}{statusConfig.label}</Badge>
                    </td>
                    <td className="p-4">
                      {offer.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'accepted', domainName: offer.domain_name || '' })} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}接受
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => { setCounterDialog({ open: true, offer }); setCounterAmount(String(Math.ceil(offer.amount * 1.2))); }}
                            disabled={isProcessing} className="gap-1">
                            <ArrowLeftRight className="h-4 w-4" />还价
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'rejected', domainName: offer.domain_name || '' })}
                            className="text-destructive hover:bg-destructive/10" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}拒绝
                          </Button>
                        </div>
                      )}
                      {offer.status === 'countered' && (
                        <span className="text-sm text-blue-600 dark:text-blue-400">等待买家回复</span>
                      )}
                      {offer.status === 'accepted' && (
                        <div className="flex gap-2">
                          {offer.transaction_id && (
                            <Link to={`/transaction/${offer.transaction_id}`}>
                              <Button size="sm" className="gap-1.5"><ArrowRight className="h-4 w-4" />进入交易</Button>
                            </Link>
                          )}
                          <Button size="sm" variant="outline"
                            onClick={() => setConfirmDialog({ open: true, offerId: offer.id, action: 'completed', domainName: offer.domain_name || '' })}
                            disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Package className="h-4 w-4 mr-1" />}标记完成
                          </Button>
                        </div>
                      )}
                      {(offer.status === 'rejected' || offer.status === 'completed' || offer.status === 'cancelled') && (
                        <span className="text-sm text-muted-foreground">无可用操作</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 确认对话框 */}
      {confirmDialog && (
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmDialog.action === 'accepted' && '确认接受报价？'}
                {confirmDialog.action === 'rejected' && '确认拒绝报价？'}
                {confirmDialog.action === 'completed' && '确认标记为已完成？'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.action === 'accepted' && `接受后系统将创建交易记录，并通知买家完成付款。`}
                {confirmDialog.action === 'rejected' && `拒绝后，买家将收到通知。此操作不可撤销。`}
                {confirmDialog.action === 'completed' && `确认域名 ${confirmDialog.domainName} 的交易已完成？`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleOfferAction(confirmDialog.offerId, confirmDialog.action)}
                className={confirmDialog.action === 'rejected' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
              >
                确认
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 还价对话框 */}
      {counterDialog && (
        <Dialog open={counterDialog.open} onOpenChange={(open) => { if (!open) { setCounterDialog(null); setCounterAmount(''); setCounterNote(''); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                向买家还价
              </DialogTitle>
              <DialogDescription>
                买家对域名 <span className="font-semibold">{counterDialog.offer.domain_name}</span> 出价{' '}
                <span className="font-semibold">${counterDialog.offer.amount.toLocaleString()}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">还价金额 *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    type="number"
                    placeholder="输入您的还价金额"
                    value={counterAmount}
                    onChange={e => setCounterAmount(e.target.value)}
                    className="pl-7"
                    data-testid="input-counter-amount"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  买家出价：${counterDialog.offer.amount.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">还价备注（可选）</label>
                <Textarea
                  placeholder="向买家解释您的还价理由..."
                  value={counterNote}
                  onChange={e => setCounterNote(e.target.value)}
                  rows={3}
                  data-testid="textarea-counter-note"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setCounterDialog(null)} className="flex-1">取消</Button>
                <Button
                  onClick={handleCounterOffer}
                  disabled={isCountering || !counterAmount}
                  className="flex-1 gap-2"
                  data-testid="button-submit-counter"
                >
                  {isCountering ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                  发送还价
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
