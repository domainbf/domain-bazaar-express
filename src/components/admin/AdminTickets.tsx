import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Clock, RefreshCw, CheckCircle, XCircle, ChevronRight,
  Send, Loader2, Headphones, ArrowLeft, User, Calendar, Tag
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Ticket {
  id: string;
  ticket_number: number;
  user_id: string;
  user_email: string;
  user_name: string;
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

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'text-muted-foreground' },
  normal: { label: '普通', color: 'text-foreground' },
  high: { label: '高', color: 'text-orange-500' },
  urgent: { label: '紧急', color: 'text-red-500' },
};

async function sendTicketEmail(opts: { to: string | string[]; subject: string; html: string }) {
  try { await supabase.functions.invoke('send-email', { body: opts }); } catch {}
}

type FilterStatus = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

export const AdminTickets = () => {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('open');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    let q = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });
    if (filterStatus !== 'all') q = q.eq('status', filterStatus);
    const { data, error } = await q;
    if (!error) setTickets(data || []);
    setLoading(false);
  };

  const fetchReplies = async (ticketId: string) => {
    setRepliesLoading(true);
    const { data } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setReplies(data || []);
    setRepliesLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [filterStatus]);

  const openTicket = (ticket: Ticket) => {
    setSelected(ticket);
    fetchReplies(ticket.id);
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    setUpdatingStatus(true);
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', selected.id);
    if (!error) {
      const updated = { ...selected, status };
      setSelected(updated);
      setTickets(ts => ts.map(t => t.id === selected.id ? updated : t));
      toast.success('状态已更新');
    }
    setUpdatingStatus(false);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSendingReply(true);
    try {
      const adminName = profile?.full_name || '客服';
      const { error } = await supabase.from('ticket_replies').insert({
        ticket_id: selected.id,
        is_admin_reply: true,
        author_name: adminName,
        content: replyText.trim(),
      });
      if (error) throw error;

      // If open → move to in_progress automatically
      if (selected.status === 'open') {
        await supabase.from('support_tickets')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', selected.id);
        const updated = { ...selected, status: 'in_progress' };
        setSelected(updated);
        setTickets(ts => ts.map(t => t.id === selected.id ? updated : t));
      }

      // Email user
      await sendTicketEmail({
        to: selected.user_email,
        subject: `[工单 #${selected.ticket_number}] 客服已回复您的问题`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#1a1a1a">您的工单有新回复</h2>
            <p>您好 ${selected.user_name || selected.user_email}，</p>
            <p>您的工单 <strong>#${selected.ticket_number}「${selected.subject}」</strong> 客服已回复：</p>
            <div style="background:#f5f5f5;border-left:4px solid #1a1a1a;padding:16px;border-radius:4px;margin:16px 0">
              <p style="margin:0;white-space:pre-wrap">${replyText.trim()}</p>
            </div>
            <p><a href="${window.location.origin}/user-center" style="background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">登录查看完整回复</a></p>
          </div>
        `,
      });

      setReplyText('');
      fetchReplies(selected.id);
      fetchTickets();
      toast.success('回复已发送，邮件通知用户');
    } catch {
      toast.error('发送失败');
    } finally {
      setSendingReply(false);
    }
  };

  const openCount = tickets.filter(t => t.status === 'open').length;

  if (selected) {
    const statusCfg = STATUS_CONFIG[selected.status] || STATUS_CONFIG.open;
    const StatusIcon = statusCfg.icon;
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
          <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{selected.subject}</p>
            <p className="text-xs text-muted-foreground">工单 #{selected.ticket_number} · {CATEGORY_LABELS[selected.category]}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selected.status} onValueChange={updateStatus} disabled={updatingStatus}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* User info bar */}
        <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 border-b border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{selected.user_name} &lt;{selected.user_email}&gt;</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(selected.created_at), 'yyyy/MM/dd HH:mm')}</span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${statusCfg.color}`}>
            <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
            {statusCfg.label}
          </Badge>
          <span className={`flex items-center gap-1 ${PRIORITY_CONFIG[selected.priority]?.color}`}>
            <Tag className="w-3 h-3" />优先级：{PRIORITY_CONFIG[selected.priority]?.label}
          </span>
        </div>

        {/* Conversation */}
        <ScrollArea className="flex-1 px-4 py-4">
          {repliesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4 pb-4">
              {replies.map(reply => (
                <div key={reply.id} className={`flex gap-3 ${reply.is_admin_reply ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    reply.is_admin_reply ? 'bg-foreground text-background' : 'bg-muted text-foreground'
                  }`}>
                    {reply.is_admin_reply ? '客' : (reply.author_name[0]?.toUpperCase() || 'U')}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${reply.is_admin_reply ? 'flex flex-col items-end' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm ${
                      reply.is_admin_reply
                        ? 'bg-foreground text-background rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
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

        {/* Reply box */}
        <div className="border-t border-border bg-background p-3">
          <div className="flex gap-2 items-end">
            <Textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="输入回复内容（将以邮件通知用户）..."
              className="flex-1 min-h-[80px] max-h-40 resize-none text-sm"
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">工单管理</h2>
          {openCount > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0 h-4">{openCount}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filterStatus === s
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/40'
              }`}
            >
              {{ all: '全部', open: '待处理', in_progress: '处理中', resolved: '已解决', closed: '已关闭' }[s]}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Headphones className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">暂无工单</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map(ticket => {
              const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
              const StatusIcon = cfg.icon;
              const priCfg = PRIORITY_CONFIG[ticket.priority];
              return (
                <button
                  key={ticket.id}
                  onClick={() => openTicket(ticket)}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">#{ticket.ticket_number}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${cfg.color}`}>
                        <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                        {cfg.label}
                      </Badge>
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        {CATEGORY_LABELS[ticket.category]}
                      </span>
                      {ticket.priority !== 'normal' && (
                        <span className={`text-[10px] font-medium ${priCfg?.color}`}>
                          {priCfg?.label}优先级
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.user_name || ticket.user_email} · {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: zhCN })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
