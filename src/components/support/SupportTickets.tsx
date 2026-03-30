import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/apiClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { buildEmail, infoTable, quoteBlock } from '@/lib/emailTemplate';
import {
  Plus, MessageCircle, Clock, CheckCircle, XCircle, ChevronRight,
  Send, Loader2, Headphones, ArrowLeft, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface Reply {
  id: string;
  author_name: string;
  content: string;
  is_admin_reply: boolean;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: '一般咨询',
  technical: '技术问题',
  billing: '账单/支付',
  domain: '域名相关',
  complaint: '投诉建议',
  other: '其他',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  open: { label: '待处理', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20', icon: Clock },
  in_progress: { label: '处理中', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: RefreshCw },
  resolved: { label: '已解决', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', icon: CheckCircle },
  closed: { label: '已关闭', color: 'bg-muted text-muted-foreground border-border', icon: XCircle },
};

async function sendTicketEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    await supabase.functions.invoke('send-email', { body: opts });
  } catch {
    // Email is best-effort; don't block the user
  }
}

export const SupportTickets = () => {
  const { user, profile } = useAuth();
  const { config } = useSiteSettings();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    category: 'general',
    description: '',
  });

  const fetchTickets = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (!error) setTickets(data || []);
    setLoading(false);
  };

  const fetchReplies = async (ticketId: string) => {
    setRepliesLoading(true);
    const { data, error } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (!error) setReplies(data || []);
    setRepliesLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [user]);

  const openTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchReplies(ticket.id);
  };

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('请填写标题和问题描述');
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const userName = profile?.full_name || user.email?.split('@')[0] || '用户';
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          user_email: user.email!,
          user_name: userName,
          subject: form.subject.trim(),
          category: form.category,
          description: form.description.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Also save description as the first reply (user's message)
      await supabase.from('ticket_replies').insert({
        ticket_id: ticket.id,
        user_id: user.id,
        author_name: userName,
        content: form.description.trim(),
        is_admin_reply: false,
      });

      // Get admin email for notification
      const { data: cfg } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'contact_email')
        .single();
      const adminEmail = cfg?.value || 'domain@nic.rw';
      const brand = {
        siteName: config.site_name || '域见•你',
        siteHostname: (config.site_domain || window.location.origin).replace(/^https?:\/\//, '').toUpperCase(),
        siteDomain: config.site_domain || window.location.origin,
        supportEmail: config.contact_email || adminEmail,
      };

      // Email admin about new ticket
      await sendTicketEmail({
        to: adminEmail,
        subject: `[新工单 #${ticket.ticket_number}] ${form.subject}`,
        html: buildEmail({
          previewText: `新支持工单来自 ${userName}：${form.subject}`,
          accentColor: '#f59e0b',
          headerEmoji: '🎫',
          title: '收到新支持工单',
          subtitle: `来自用户 ${userName}，请尽快处理`,
          body: `
            ${infoTable([
              { label: '工单编号', value: `#${ticket.ticket_number}`, highlight: true },
              { label: '用户', value: `${userName} <${user.email}>` },
              { label: '类别', value: CATEGORY_LABELS[form.category] },
              { label: '标题', value: form.subject, highlight: true },
            ])}
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">用户描述</p>
            ${quoteBlock(form.description, 'amber')}
          `,
          ctaLabel: '前往后台处理',
          ctaUrl: `${brand.siteDomain}/admin?tab=tickets`,
          footerNote: `工单 #${ticket.ticket_number} · ${brand.siteName} 管理后台`,
          brand,
        }),
      });

      // Confirmation email to user
      await sendTicketEmail({
        to: user.email!,
        subject: `工单 #${ticket.ticket_number} 已收到 — ${brand.siteName}`,
        html: buildEmail({
          previewText: `您的工单已收到，我们将在工作日24小时内回复您`,
          accentColor: 'linear-gradient(90deg,#0f172a 0%,#334155 100%)',
          headerEmoji: '✅',
          title: '工单已提交成功',
          subtitle: '我们已收到您的工单，将尽快为您处理',
          body: `
            <p style="margin:0 0 20px;font-size:15px;color:#374151;">您好 <strong>${userName}</strong>，感谢您联系我们！</p>
            ${infoTable([
              { label: '工单编号', value: `#${ticket.ticket_number}`, highlight: true },
              { label: '标题', value: form.subject },
              { label: '类别', value: CATEGORY_LABELS[form.category] },
              { label: '预计回复', value: '工作日 24 小时内' },
            ])}
            <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.7;">如有紧急情况，请直接发送邮件至 <a href="mailto:${brand.supportEmail}" style="color:#0f172a;font-weight:600;">${brand.supportEmail}</a>。</p>
          `,
          ctaLabel: '查看我的工单',
          ctaUrl: `${brand.siteDomain}/user-center?tab=support`,
          brand,
        }),
      });

      toast.success(`工单 #${ticket.ticket_number} 已提交，确认邮件已发送到您的邮箱`);
      setForm({ subject: '', category: 'general', description: '' });
      setShowNewForm(false);
      fetchTickets();
    } catch (err: any) {
      toast.error('提交失败：' + (err.message || '请稍后重试'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket || !user) return;
    setSendingReply(true);
    try {
      const userName = profile?.full_name || user.email?.split('@')[0] || '用户';
      const { error } = await supabase.from('ticket_replies').insert({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        author_name: userName,
        content: replyText.trim(),
        is_admin_reply: false,
      });
      if (error) throw error;

      // Notify admin
      const { data: cfg } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'contact_email')
        .single();
      const adminEmail = cfg?.value || 'domain@nic.rw';
      const replyBrand = {
        siteName: config.site_name || '域见•你',
        siteHostname: (config.site_domain || window.location.origin).replace(/^https?:\/\//, '').toUpperCase(),
        siteDomain: config.site_domain || window.location.origin,
        supportEmail: config.contact_email || adminEmail,
      };
      await sendTicketEmail({
        to: adminEmail,
        subject: `[工单 #${selectedTicket.ticket_number} 新回复] ${selectedTicket.subject}`,
        html: buildEmail({
          previewText: `用户 ${userName} 回复了工单 #${selectedTicket.ticket_number}`,
          accentColor: '#3b82f6',
          headerEmoji: '💬',
          title: '工单有新回复',
          subtitle: `工单 #${selectedTicket.ticket_number} · ${CATEGORY_LABELS[selectedTicket.category] || '一般咨询'}`,
          body: `
            ${infoTable([
              { label: '工单编号', value: `#${selectedTicket.ticket_number}`, highlight: true },
              { label: '工单标题', value: selectedTicket.subject },
              { label: '回复用户', value: `${userName} <${user.email}>` },
            ])}
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">用户回复内容</p>
            ${quoteBlock(replyText.trim(), 'gray')}
          `,
          ctaLabel: '前往后台查看',
          ctaUrl: `${replyBrand.siteDomain}/admin?tab=tickets`,
          footerNote: `${replyBrand.siteName} 管理后台 · 自动通知`,
          brand: replyBrand,
        }),
      });

      setReplyText('');
      fetchReplies(selectedTicket.id);
      fetchTickets();
      toast.success('回复已发送');
    } catch (err: any) {
      toast.error('发送失败');
    } finally {
      setSendingReply(false);
    }
  };

  if (selectedTicket) {
    const statusCfg = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.open;
    const StatusIcon = statusCfg.icon;
    const isClosed = ['resolved', 'closed'].includes(selectedTicket.status);
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
          <button onClick={() => setSelectedTicket(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{selectedTicket.subject}</p>
            <p className="text-xs text-muted-foreground">工单 #{selectedTicket.ticket_number} · {CATEGORY_LABELS[selectedTicket.category]}</p>
          </div>
          <Badge variant="outline" className={`text-xs shrink-0 ${statusCfg.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusCfg.label}
          </Badge>
        </div>

        <ScrollArea className="flex-1 px-4 py-3">
          {repliesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4 pb-4">
              {replies.map(reply => (
                <div key={reply.id} className={`flex gap-3 ${reply.is_admin_reply ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    reply.is_admin_reply ? 'bg-foreground text-background' : 'bg-muted text-foreground'
                  }`}>
                    {reply.is_admin_reply ? '客' : reply.author_name[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${reply.is_admin_reply ? '' : 'flex flex-col items-end'}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm ${
                      reply.is_admin_reply
                        ? 'bg-muted text-foreground rounded-tl-sm'
                        : 'bg-foreground text-background rounded-tr-sm'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {reply.is_admin_reply ? '客服' : reply.author_name} · {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: zhCN })}
                    </p>
                  </div>
                </div>
              ))}
              {replies.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">暂无回复记录</div>
              )}
            </div>
          )}
        </ScrollArea>

        {!isClosed && (
          <div className="border-t border-border bg-background p-3">
            <div className="flex gap-2 items-end">
              <Textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="补充问题描述或回复客服..."
                className="flex-1 min-h-[72px] max-h-32 resize-none text-sm"
                disabled={sendingReply}
              />
              <Button
                size="icon"
                className="shrink-0 h-10 w-10"
                onClick={handleReply}
                disabled={!replyText.trim() || sendingReply}
              >
                {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            {isClosed && <p className="text-xs text-muted-foreground mt-2 text-center">此工单已关闭，无法继续回复</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-2 pb-3">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">我的工单</span>
        </div>
        <Button size="sm" onClick={() => setShowNewForm(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          新建工单
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground mb-1">还没有工单</p>
            <p className="text-sm text-muted-foreground mb-6">遇到问题？提交工单，客服将在24小时内回复</p>
            <Button onClick={() => setShowNewForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              提交新工单
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map(ticket => {
              const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
              const StatusIcon = cfg.icon;
              return (
                <button
                  key={ticket.id}
                  onClick={() => openTicket(ticket)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">#{ticket.ticket_number}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${cfg.color}`}>
                        <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                        {cfg.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {CATEGORY_LABELS[ticket.category]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      更新于 {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: zhCN })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* New Ticket Dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              提交支持工单
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">问题类别</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                问题标题 <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="简短描述您的问题"
                maxLength={100}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                详细描述 <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="请详细描述您的问题，包括操作步骤、错误信息等..."
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewForm(false)} disabled={submitting}>
                取消
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                提交工单
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
