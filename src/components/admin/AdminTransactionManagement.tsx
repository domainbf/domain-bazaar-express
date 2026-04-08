import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/apiClient';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { RefreshCw, Search, Eye, CheckCircle, XCircle, AlertTriangle, DollarSign, Clock, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { buildEmail, infoTable, amountBlock } from '@/lib/emailTemplate';
import { getDomainDetailPath } from '@/lib/domainRouting';

interface AdminTransaction {
  id: string;
  amount: number;
  status: string;
  commission_amount: number | null;
  commission_rate: number | null;
  seller_amount: number | null;
  payment_method: string;
  created_at: string;
  completed_at: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  domain_id: string;
  offer_id: string | null;
  notes: string | null;
  buyer_email?: string;
  seller_email?: string;
  domain_name?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 dark:bg-blue-900/30 dark:text-blue-400',
  in_escrow: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 dark:bg-purple-900/30 dark:text-purple-400',
  domain_transferred: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  completed: 'bg-green-500/15 text-green-600 dark:text-green-400 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-muted text-foreground dark:bg-gray-900/30 dark:text-muted-foreground',
  disputed: 'bg-red-500/15 text-red-600 dark:text-red-400 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '等待付款', paid: '已付款', in_escrow: '托管中',
  domain_transferred: '域名已转移', completed: '已完成',
  cancelled: '已取消', disputed: '纠纷中', refunded: '已退款',
};

export const AdminTransactionManagement = () => {
  const { config } = useSiteSettings();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [isActing, setIsActing] = useState(false);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<AdminTransaction[]>('/data/admin/transactions');
      setTransactions(Array.isArray(data) ? data.map(t => ({
        ...t,
        domain_name: t.domain_name || '—',
        buyer_email: t.buyer_email || '—',
        seller_email: t.seller_email || '—',
      })) : []);
    } catch (err: any) {
      toast.error('加载交易记录失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const handleStatusUpdate = async (txId: string, newStatus: string) => {
    setIsActing(true);
    try {
      await apiPatch(`/data/admin/transactions/${txId}`, {
        status: newStatus,
        notes: actionNote || undefined,
        domain_id: selectedTx?.domain_id || undefined,
      });

      // Send email notifications based on the new status
      if (selectedTx) {
        const brand = {
          siteName: config.site_name || '域见•你',
          siteHostname: (config.site_domain || window.location.origin).replace(/^https?:\/\//, '').toUpperCase(),
          siteDomain: config.site_domain || window.location.origin,
          supportEmail: config.contact_email || 'support@nic.rw',
        };
        const domainName = (selectedTx.domain_name || '').toUpperCase() || '域名';
        const txUrl = `${brand.siteDomain}/user-center?tab=transactions`;
        const fmtAmount = `¥${Number(selectedTx.amount || 0).toLocaleString()}`;
        const fmtSeller = selectedTx.seller_amount != null ? `¥${Number(selectedTx.seller_amount).toLocaleString()}` : fmtAmount;
        const txInfo = infoTable([
          { label: '交易编号', value: txId.substring(0, 8).toUpperCase() },
          { label: '域名', value: domainName, highlight: true },
          { label: '交易金额', value: fmtAmount, highlight: true },
          { label: '状态', value: STATUS_LABELS[newStatus] || newStatus },
          ...(actionNote ? [{ label: '管理员备注', value: actionNote }] : []),
        ]);

        const sendTxEmail = (to: string | null | undefined, subject: string, html: string) => {
          if (!to || !to.includes('@')) return;
          supabase.functions.invoke('send-email', { body: { to, subject, html } }).catch(() => {});
        };

        // Reusable section builder helpers
        const stepList = (steps: string[]) =>
          `<table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin-bottom:20px;">
            ${steps.map((s, i) => `<tr><td style="padding:5px 0;font-size:13px;color:#475569;line-height:1.5;">
              <span style="display:inline-block;background:#0f172a;color:#f8fafc;border-radius:50%;width:20px;height:20px;line-height:20px;text-align:center;font-size:11px;font-weight:700;margin-right:10px;vertical-align:middle;">${i+1}</span>
              ${s}
            </td></tr>`).join('')}
          </table>`;

        const infoBox = (emoji: string, title: string, body: string, color = '#f8fafc', border = '#e2e8f0') =>
          `<div style="background:${color};border:1px solid ${border};border-radius:10px;padding:16px 18px;margin-bottom:20px;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0f172a;">${emoji} ${title}</p>
            <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">${body}</p>
          </div>`;

        const feeTable = (amount: number, commission: number) => {
          const seller = amount - commission;
          return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:20px;">
            <tr><td style="padding:11px 16px;background:#f8fafc;font-size:12px;font-weight:700;color:#94a3b8;width:50%;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">交易总价</td>
                <td style="padding:11px 16px;font-size:14px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;">¥${amount.toLocaleString()}</td></tr>
            <tr><td style="padding:11px 16px;background:#f8fafc;font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">平台手续费（1%）</td>
                <td style="padding:11px 16px;font-size:14px;color:#dc2626;border-bottom:1px solid #f1f5f9;">−¥${commission.toLocaleString()}</td></tr>
            <tr><td style="padding:11px 16px;background:#f0fdf4;font-size:12px;font-weight:700;color:#15803d;letter-spacing:0.5px;text-transform:uppercase;">您的到账金额</td>
                <td style="padding:11px 16px;font-size:16px;font-weight:900;color:#15803d;">¥${seller.toLocaleString()}</td></tr>
          </table>`;
        };

        const txAmount = Number(selectedTx.amount || 0);
        const commission = Number(selectedTx.commission_amount || Math.round(txAmount * 0.01));

        if (newStatus === 'in_escrow') {
          // Buyer: payment confirmed, funds in escrow
          sendTxEmail(selectedTx.buyer_email, `✅ 付款已确认：${domainName} 资金安全担保中`, buildEmail({
            previewText: `您的付款已确认，${domainName} 资金已进入安全担保`,
            accentColor: '#16a34a',
            headerEmoji: '🔒',
            title: '付款已确认，资金安全担保中',
            subtitle: `平台已收到您的付款，${domainName} 正在办理过户`,
            body: `
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                平台已确认收到您的付款，资金已进入安全担保账户。在域名过户完成并经您确认之前，款项将由平台全程保管，保障您的资金安全。
              </p>
              ${txInfo}
              ${amountBlock({ label: '担保金额', amount: fmtAmount, sublabel: '资金安全托管中，域名确认后结算给卖家', color: '#0f172a' })}
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">接下来的流程</p>
              ${stepList([
                `卖家收到通知后，开始准备域名过户所需材料`,
                `卖家在注册商处完成域名转移操作`,
                `您收到域名转入通知，登录平台 <strong>确认接收</strong>`,
                `确认后平台自动向卖家释放款项，交易完成`,
              ])}
              ${infoBox('⏱️', '预计过户时间', '域名过户通常需要 1–3 个工作日，具体取决于注册商处理速度。如超过 5 个工作日仍未收到域名，请联系平台客服。', '#eff6ff', '#bfdbfe')}
              ${infoBox('🛡️', '资金安全保障', '在您确认收到域名之前，资金不会释放给卖家。如域名未按时转移，您可以申请退款，平台全程保护您的权益。', '#f0fdf4', '#bbf7d0')}
            `,
            ctaLabel: '查看交易进度',
            ctaUrl: txUrl,
            brand,
          }));
          // Seller: buyer has paid
          sendTxEmail(selectedTx.seller_email, `💰 买家已付款：${domainName} 请配合过户`, buildEmail({
            previewText: `买家已付款，${domainName} 资金已进入平台担保，请尽快配合过户`,
            accentColor: '#0f172a',
            headerEmoji: '💰',
            title: '买家已付款，请配合过户',
            subtitle: `${domainName} 交易款项已进入平台担保账户`,
            body: `
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                买家已完成付款，资金已由平台安全担保。请尽快按照以下步骤完成域名过户，过户完成并买家确认后，款项将自动划入您的账户。
              </p>
              ${txInfo}
              ${feeTable(txAmount, commission)}
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">过户操作步骤</p>
              ${stepList([
                `登录您的域名注册商账户（GoDaddy / 阿里云 / Namecheap 等）`,
                `找到域名 <strong>${domainName}</strong>，发起域名转移/推送`,
                `将域名转移给买家（通过 Auth Code 或账户推送）`,
                `在本平台填写过户凭证，等待买家确认接收`,
                `买家确认后，款项自动结算到您的账户`,
              ])}
              ${infoBox('⚠️', '重要提醒', `请在 <strong>3 个工作日内</strong>完成过户操作。超时可能导致买家申请退款，影响您的账户信誉。如遇技术问题请立即联系客服。`, '#fefce8', '#fef08a')}
              ${infoBox('💡', '过户小贴士', '如买家使用的是国内注册商（如阿里云、腾讯云），可使用"账户内域名转移"方式，速度更快；如是国际注册商，使用 Auth Code 转移即可。', '#f8fafc', '#e2e8f0')}
            `,
            ctaLabel: '查看交易详情',
            ctaUrl: txUrl,
            brand,
          }));
        } else if (newStatus === 'domain_transferred') {
          // Buyer: domain transferred, please confirm
          sendTxEmail(selectedTx.buyer_email, `📦 域名已转移：请登录确认接收 ${domainName}`, buildEmail({
            previewText: `${domainName} 域名已转移，请登录确认接收，确认后款项将结算给卖家`,
            accentColor: '#7c3aed',
            headerEmoji: '📦',
            title: '域名已转移，请确认接收',
            subtitle: `卖家已完成 ${domainName} 的转移，等待您的确认`,
            body: `
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                卖家已完成域名转移操作，${domainName} 正在转入您的账户。请登录您的域名注册商，确认域名已成功到账，然后在平台点击"确认接收"完成交易。
              </p>
              ${txInfo}
              ${amountBlock({ label: '待确认金额', amount: fmtAmount, sublabel: '确认接收后款项将自动结算给卖家', color: '#7c3aed' })}
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">如何确认接收域名</p>
              ${stepList([
                `登录您的域名注册商账户，查看 <strong>${domainName}</strong> 是否已出现在您的域名列表中`,
                `确认域名 Whois 信息已更新为您的注册人信息`,
                `返回 ${brand.siteName} 平台，在交易页面点击 <strong>"确认接收"</strong> 按钮`,
                `交易自动完成，款项结算给卖家`,
              ])}
              ${infoBox('⚠️', '请在 48 小时内确认', `若您 48 小时内未操作，系统将自动确认完成交易。如域名未到账，请 <strong>不要</strong> 点击确认，立即联系平台客服发起争议。`, '#fefce8', '#fef08a')}
              ${infoBox('🔍', '如何检查域名归属', `在浏览器打开 <a href="https://lookup.icann.org" style="color:#7c3aed;">lookup.icann.org</a> 查询 ${domainName} 的注册人信息是否已更新为您的信息。通常注册商处理需 1–24 小时。`, '#eff6ff', '#bfdbfe')}
            `,
            ctaLabel: '确认接收域名',
            ctaUrl: txUrl,
            brand,
          }));
          // Seller: notify about transfer pending confirmation
          sendTxEmail(selectedTx.seller_email, `⏳ 等待买家确认：${domainName} 过户完成`, buildEmail({
            previewText: `${domainName} 域名过户完成，等待买家确认接收后款项结算`,
            accentColor: '#7c3aed',
            headerEmoji: '⏳',
            title: '过户完成，等待买家确认',
            subtitle: `${domainName} 已转移，款项将在买家确认后结算`,
            body: `
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                平台已记录您的过户操作，买家收到通知后将登录确认域名接收。确认完成后款项将自动划入您的账户，通常 48 小时内完成。
              </p>
              ${txInfo}
              ${feeTable(txAmount, commission)}
              ${infoBox('⏱️', '预计结算时间', `买家确认接收后款项立即结算。如买家 48 小时内未操作，系统将<strong>自动完成</strong>交易并结算款项给您。`, '#f0fdf4', '#bbf7d0')}
              ${infoBox('❓', '如买家有争议', '如果买家对域名接收有异议，平台将介入调查。请保留好过户凭证截图备用。', '#fefce8', '#fef08a')}
            `,
            ctaLabel: '查看交易进度',
            ctaUrl: txUrl,
            brand,
          }));
        } else if (newStatus === 'completed') {
          // Buyer: transaction complete
          sendTxEmail(selectedTx.buyer_email, `🎉 交易完成：${domainName} 正式归属您名下`, buildEmail({
            previewText: `恭喜！${domainName} 域名已完成过户，正式归属您名下`,
            accentColor: '#16a34a',
            headerEmoji: '🎉',
            title: '交易完成，域名到手！',
            subtitle: `${domainName} 已正式归属您名下，感谢使用 ${brand.siteName}`,
            body: `
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                恭喜您！${domainName} 域名交易已圆满完成，域名已正式归属您名下。感谢您使用 ${brand.siteName} 平台进行域名交易。
              </p>
              ${txInfo}
              ${amountBlock({ label: '交易金额', amount: fmtAmount, sublabel: '交易已完成结算', color: '#16a34a' })}
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">下一步建议</p>
              ${stepList([
                `登录注册商控制台，检查 ${domainName} 的 DNS 配置，按需修改`,
                `设置域名续费提醒，避免域名到期流失`,
                `如需出售域名，可在 ${brand.siteName} 发布新的出售挂单`,
                `对本次交易体验满意？欢迎在平台给卖家留下评价`,
              ])}
              ${infoBox('🛡️', '交易凭证', `本次交易编号 <strong>${txId.substring(0,8).toUpperCase()}</strong> 已记录在案，可在用户中心→交易记录中随时查询完整凭证。`, '#f0fdf4', '#bbf7d0')}
              ${infoBox('💡', '域名管理建议', `建议您立即登录注册商，将域名的注册人邮箱更新为您的常用邮箱，并开启"域名锁定"保护，防止意外转移。`, '#eff6ff', '#bfdbfe')}
            `,
            ctaLabel: '查看我的域名',
            ctaUrl: txUrl,
            brand,
          }));
          // Seller: payment released
          sendTxEmail(selectedTx.seller_email, `💸 款项已到账：${domainName} 交易结算完成`, buildEmail({
            previewText: `${domainName} 交易完成，扣费后款项已划入您的账户`,
            accentColor: '#16a34a',
            headerEmoji: '💸',
            title: '款项已结算到账',
            subtitle: `${domainName} 交易圆满完成，感谢使用 ${brand.siteName}`,
            body: `
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                买家已确认接收域名，交易正式完成。扣除平台手续费后的款项已划入您的账户，请登录查看。感谢您使用 ${brand.siteName} 平台出售域名。
              </p>
              ${feeTable(txAmount, commission)}
              ${txInfo}
              ${infoBox('✅', '结算说明', `款项已即时划入您的 ${brand.siteName} 账户余额。如需提现，请在用户中心→钱包中发起提现申请，通常 1–3 个工作日到账。`, '#f0fdf4', '#bbf7d0')}
              ${infoBox('🌟', '感谢您的信任', `本次交易 <strong>编号 ${txId.substring(0,8).toUpperCase()}</strong> 已完成归档。您可在交易记录中随时下载交易凭证。期待您继续在 ${brand.siteName} 出售更多优质域名！`, '#f8fafc', '#e2e8f0')}
            `,
            ctaLabel: '查看我的收益',
            ctaUrl: txUrl,
            brand,
          }));
        } else if (newStatus === 'cancelled') {
          // Buyer cancelled notice
          sendTxEmail(selectedTx.buyer_email, `❌ 交易已取消：${domainName}`, buildEmail({
            previewText: `${domainName} 本次交易已取消`,
            accentColor: '#94a3b8',
            headerEmoji: '❌',
            title: '交易已取消',
            subtitle: `${domainName} 本次交易已由平台取消`,
            body: `
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                本次交易已由平台取消。如您已付款，退款将在 3–7 个工作日内退还至原支付账户。
              </p>
              ${txInfo}
              ${actionNote ? infoBox('📝', '取消原因', actionNote, '#f8fafc', '#e2e8f0') : ''}
              ${infoBox('💳', '退款说明', '如您已完成付款，款项将退回至您的原支付账户（支付宝/微信/银行卡）。退款到账时间因支付渠道而异，一般为 3–7 个工作日。', '#eff6ff', '#bfdbfe')}
              ${infoBox('❓', '有疑问？', `如对取消原因或退款有疑问，请通过平台客服中心联系我们，我们将在 24 小时内回复。`, '#fefce8', '#fef08a')}
            `,
            ctaLabel: '联系客服',
            ctaUrl: `${brand.siteDomain}/support`,
            brand,
          }));
          // Seller cancelled notice
          sendTxEmail(selectedTx.seller_email, `❌ 交易已取消：${domainName}`, buildEmail({
            previewText: `${domainName} 本次交易已取消，域名已恢复上架`,
            accentColor: '#94a3b8',
            headerEmoji: '❌',
            title: '交易已取消',
            subtitle: `${domainName} 本次交易已取消，域名已恢复上架状态`,
            body: `
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                本次交易已由平台取消，${domainName} 已恢复到"上架中"状态，其他买家仍可提交报价。
              </p>
              ${txInfo}
              ${actionNote ? infoBox('📝', '取消原因', actionNote, '#f8fafc', '#e2e8f0') : ''}
              ${infoBox('🔄', '域名状态', `${domainName} 已自动恢复为"上架中"状态，可继续在平台接收新的买家报价。您无需进行任何操作。`, '#f0fdf4', '#bbf7d0')}
            `,
            ctaLabel: '管理我的域名',
            ctaUrl: txUrl,
            brand,
          }));
        } else if (newStatus === 'refunded') {
          sendTxEmail(selectedTx.buyer_email, `↩️ 退款通知：${domainName} 款项退还中`, buildEmail({
            previewText: `${domainName} 交易退款已发起，${fmtAmount} 将退还至原支付账户`,
            accentColor: '#f97316',
            headerEmoji: '↩️',
            title: '退款已发起',
            subtitle: `${fmtAmount} 将退还至您的原支付账户`,
            body: `
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                平台已发起退款，款项将在 3–7 个工作日内退还至您的原支付账户，请注意查收。
              </p>
              ${txInfo}
              ${amountBlock({ label: '退款金额', amount: fmtAmount, sublabel: '退还至原支付账户', color: '#f97316' })}
              ${infoBox('⏱️', '退款到账时间', '退款处理时间因支付渠道而异：<br>• 支付宝 / 微信支付：1–3 个工作日<br>• 银行卡：3–7 个工作日<br>• 如超过 7 个工作日未到账，请联系客服', '#fefce8', '#fef08a')}
              ${infoBox('❓', '有疑问？', '如对退款金额或到账时间有疑问，请通过平台客服中心提交工单，我们将在 24 小时内处理。', '#eff6ff', '#bfdbfe')}
            `,
            ctaLabel: '查看退款状态',
            ctaUrl: txUrl,
            brand,
          }));
          // Notify seller of refund too
          sendTxEmail(selectedTx.seller_email, `↩️ 交易退款：${domainName} 款项已退还买家`, buildEmail({
            previewText: `${domainName} 交易已退款，域名已恢复上架`,
            accentColor: '#f97316',
            headerEmoji: '↩️',
            title: '交易退款通知',
            subtitle: `${domainName} 本次交易款项已退还买家`,
            body: `
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                本次交易因故退款，${fmtAmount} 已退还给买家。${domainName} 已恢复"上架中"状态，您可以继续接收其他买家的报价。
              </p>
              ${txInfo}
              ${actionNote ? infoBox('📝', '退款原因', actionNote, '#f8fafc', '#e2e8f0') : ''}
              ${infoBox('🔄', '域名已恢复上架', `${domainName} 已自动恢复为"上架中"状态，其他买家可继续报价和购买。`, '#f0fdf4', '#bbf7d0')}
            `,
            ctaLabel: '管理我的域名',
            ctaUrl: txUrl,
            brand,
          }));
        }
      }

      toast.success(`交易状态已更新为：${STATUS_LABELS[newStatus]}`);
      setShowDetail(false);
      setActionNote('');
      loadTransactions();
    } catch (err: any) {
      toast.error('状态更新失败');
    } finally {
      setIsActing(false);
    }
  };

  const filtered = transactions.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const s = search.toLowerCase();
    const matchSearch = !s || t.domain_name?.toLowerCase().includes(s) || t.buyer_email?.toLowerCase().includes(s) || t.seller_email?.toLowerCase().includes(s) || t.id.includes(s);
    return matchStatus && matchSearch;
  });

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => ['pending', 'paid', 'in_escrow'].includes(t.status)).length,
    disputed: transactions.filter(t => t.status === 'disputed').length,
    totalRevenue: transactions.filter(t => t.status === 'completed').reduce((s, t) => s + (t.commission_amount ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">交易管理</h2>
          <p className="text-sm text-muted-foreground">管理平台上的所有买卖交易</p>
        </div>
        <Button onClick={loadTransactions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />刷新
        </Button>
      </div>

      {/* 统计行 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '全部交易', value: stats.total, color: 'text-foreground' },
          { label: '已完成', value: stats.completed, color: 'text-green-600' },
          { label: '进行中', value: stats.pending, color: 'text-blue-600' },
          { label: '纠纷中', value: stats.disputed, color: 'text-red-600' },
          { label: '平台手续费', value: `¥${stats.totalRevenue.toLocaleString()}`, color: 'text-orange-600' },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 过滤器 */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="搜索域名、买家或卖家..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="状态筛选" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 交易表格 */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">暂无交易记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>域名</TableHead>
                    <TableHead>买家</TableHead>
                    <TableHead>卖家</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                    <TableHead className="text-right">手续费</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(tx => (
                    <TableRow key={tx.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Link to={getDomainDetailPath(tx.domain_name)} className="font-medium hover:underline text-sm">{tx.domain_name}</Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-32 truncate">{tx.buyer_email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-32 truncate">{tx.seller_email}</TableCell>
                      <TableCell className="text-right font-semibold">¥{Number(tx.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm text-orange-600">
                        {tx.commission_amount ? `¥${Number(tx.commission_amount).toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[tx.status] ?? ''}`}>
                          {STATUS_LABELS[tx.status] ?? tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => { setSelectedTx(tx); setShowDetail(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 交易详情 Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>交易详情</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">交易ID：</span><span className="font-mono text-xs">{selectedTx.id.slice(0, 8)}...</span></div>
                <div><span className="text-muted-foreground">域名：</span><strong>{selectedTx.domain_name}</strong></div>
                <div><span className="text-muted-foreground">买家：</span>{selectedTx.buyer_email}</div>
                <div><span className="text-muted-foreground">卖家：</span>{selectedTx.seller_email}</div>
                <div><span className="text-muted-foreground">金额：</span><strong>¥{Number(selectedTx.amount).toLocaleString()}</strong></div>
                <div><span className="text-muted-foreground">手续费：</span>¥{Number(selectedTx.commission_amount ?? 0).toLocaleString()} ({selectedTx.commission_rate}%)</div>
                <div><span className="text-muted-foreground">卖家到手：</span>¥{Number(selectedTx.seller_amount ?? 0).toLocaleString()}</div>
                <div><span className="text-muted-foreground">支付方式：</span>{selectedTx.payment_method}</div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">当前状态：</span>
                  <Badge className={`ml-2 text-xs ${STATUS_COLORS[selectedTx.status] ?? ''}`}>
                    {STATUS_LABELS[selectedTx.status]}
                  </Badge>
                </div>
                {selectedTx.notes && (
                  <div className="col-span-2"><span className="text-muted-foreground">备注：</span>{selectedTx.notes}</div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">操作备注（可选）</label>
                <Textarea
                  className="mt-1"
                  placeholder="添加操作备注..."
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedTx.status === 'pending' && (
                  <Button size="sm" onClick={() => handleStatusUpdate(selectedTx.id, 'paid')} disabled={isActing}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />确认已付款
                  </Button>
                )}
                {selectedTx.status === 'paid' && (
                  <Button size="sm" onClick={() => handleStatusUpdate(selectedTx.id, 'in_escrow')} disabled={isActing}>
                    <Clock className="h-3.5 w-3.5 mr-1.5" />进入托管
                  </Button>
                )}
                {selectedTx.status === 'in_escrow' && (
                  <Button size="sm" onClick={() => handleStatusUpdate(selectedTx.id, 'domain_transferred')} disabled={isActing}>
                    <Globe className="h-3.5 w-3.5 mr-1.5" />确认域名已转移
                  </Button>
                )}
                {selectedTx.status === 'domain_transferred' && (
                  <Button size="sm" variant="default" onClick={() => handleStatusUpdate(selectedTx.id, 'completed')} disabled={isActing}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />标记为完成
                  </Button>
                )}
                {!['completed', 'cancelled', 'refunded', 'disputed'].includes(selectedTx.status) && (
                  <>
                    <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(selectedTx.id, 'disputed')} disabled={isActing}>
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />标记纠纷
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(selectedTx.id, 'cancelled')} disabled={isActing}>
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />取消交易
                    </Button>
                  </>
                )}
                {selectedTx.status === 'disputed' && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(selectedTx.id, 'refunded')} disabled={isActing}>
                    已退款
                  </Button>
                )}
              </div>

              <Link to={`/transaction/${selectedTx.id}`} target="_blank">
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />查看完整交易页面
                </Button>
              </Link>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
