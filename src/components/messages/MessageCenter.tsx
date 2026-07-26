import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Send, User, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface OtherUserProfile {
  full_name: string | null;
  username: string | null;
}

interface MessageCenterProps {
  otherUserId: string;
  transactionId?: string;
  domainId?: string;
  offerId?: string;
  onReadReceipt?: () => void;
}

export const MessageCenter = ({ otherUserId, transactionId, domainId, offerId, onReadReceipt }: MessageCenterProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState<OtherUserProfile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const markThreadAsRead = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await supabase.from('messages').update({ is_read: true }).in('id', ids);
      onReadReceipt?.();
    } catch { /* ignore */ }
  }, [onReadReceipt]);

  const loadMessages = useCallback(async () => {
    if (!user || !otherUserId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, is_read, created_at')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });
      if (error) throw error;
      const list = (data ?? []) as Message[];
      setMessages(list);
      const unreadIds = list.filter(m => m.receiver_id === user.id && !m.is_read).map(m => m.id);
      if (unreadIds.length) {
        setMessages(prev => prev.map(m => (unreadIds.includes(m.id) ? { ...m, is_read: true } : m)));
        void markThreadAsRead(unreadIds);
      }
    } catch {
      toast.error('加载消息失败');
    } finally {
      setIsLoading(false);
    }
  }, [user, otherUserId, markThreadAsRead]);

  const loadOtherUser = useCallback(async () => {
    if (!otherUserId) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', otherUserId)
      .maybeSingle();
    if (data) setOtherUser({ full_name: data.full_name, username: data.username });
  }, [otherUserId]);

  useEffect(() => {
    if (!user || !otherUserId) return;
    setIsLoading(true);
    loadMessages();
    loadOtherUser();
  }, [user, otherUserId, loadMessages, loadOtherUser]);

  useEffect(() => {
    if (!user || !otherUserId) return;
    const channel = supabase
      .channel(`thread-${user.id}-${otherUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const row = (payload.new ?? payload.old) as Partial<Message> | undefined;
          if (!row) return;
          const inThread =
            (row.sender_id === user.id && row.receiver_id === otherUserId) ||
            (row.sender_id === otherUserId && row.receiver_id === user.id);
          if (inThread) loadMessages();
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, otherUserId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return;
    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: otherUserId,
        content,
        transaction_id: transactionId ?? null,
        domain_id: domainId ?? null,
        offer_id: offerId ?? null,
      });
      if (error) throw error;
      await loadMessages();
    } catch {
      toast.error('发送失败，请重试');
      setNewMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  const otherName = otherUser?.full_name ?? otherUser?.username ?? '对方';

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">开始与{otherName}的对话</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-xs">
                    {isMine ? (user?.email?.[0]?.toUpperCase() ?? 'U') : otherName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    isMine ? 'bg-foreground text-background dark:bg-foreground dark:text-background rounded-tr-sm' : 'bg-muted rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 px-1 flex items-center gap-1">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: zhCN })}
                    {isMine && (
                      msg.is_read
                        ? <CheckCheck className="w-3 h-3 text-primary" aria-label="已读" />
                        : <Check className="w-3 h-3 opacity-60" aria-label="已送达" />
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="输入消息..."
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          data-testid="input-message"
          className="flex-1"
          aria-label="消息内容"
        />
        <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending} size="icon" data-testid="button-send-message" aria-label="发送消息">
          {isSending ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

// Standalone Messages Page for full-screen use
export const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Array<{
    userId: string;
    userName: string;
    lastMessage: string;
    lastTime: string;
    unread: number;
  }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!msgs) { setConversations([]); return; }

      const convMap = new Map<string, { lastMessage: string; lastTime: string; unread: number }>();
      msgs.forEach((m: Message) => {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        const isUnread = !m.is_read && m.receiver_id === user.id;
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            lastMessage: m.content,
            lastTime: m.created_at,
            unread: isUnread ? 1 : 0,
          });
        } else if (isUnread) {
          const existing = convMap.get(otherId)!;
          convMap.set(otherId, { ...existing, unread: existing.unread + 1 });
        }
      });

      const userIds = Array.from(convMap.keys());
      if (userIds.length === 0) { setConversations([]); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      setConversations(userIds.map(uid => {
        const profile = profiles?.find(p => p.id === uid);
        return {
          userId: uid,
          userName: profile?.full_name ?? profile?.username ?? '未知用户',
          ...convMap.get(uid)!,
        };
      }));
    } catch {
      toast.error('加载会话失败');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  useRealtimeSubscription(['messages'], () => { loadConversations(); }, !!user);

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  const list = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <p className="font-semibold text-sm flex items-center gap-2">
          消息
          {totalUnread > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </p>
        {conversations.length > 0 && (
          <span className="text-xs text-muted-foreground">{conversations.length} 个会话</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">暂无会话</p>
            <p className="text-xs text-muted-foreground mt-1">在域名详情页联系卖家即可开始对话</p>
          </div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.userId}
              className={`w-full text-left p-3 border-b hover:bg-muted/40 transition-colors ${selectedUserId === conv.userId ? 'bg-muted' : ''}`}
              onClick={() => setSelectedUserId(conv.userId)}
              data-testid={`conversation-${conv.userId}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm truncate ${conv.unread > 0 ? 'font-semibold' : 'font-medium'}`}>{conv.userName}</span>
                {conv.unread > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center shrink-0">
                    {conv.unread > 99 ? '99+' : conv.unread}
                  </span>
                )}
              </div>
              <p className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{conv.lastMessage}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {formatDistanceToNow(new Date(conv.lastTime), { addSuffix: true, locale: zhCN })}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const conversation = selectedUserId ? (
    <div className="flex flex-col h-full">
      <div className="md:hidden p-2 border-b">
        <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(null)} className="text-xs">
          ← 返回会话列表
        </Button>
      </div>
      <div className="flex-1 min-h-0">
        <MessageCenter otherUserId={selectedUserId} onReadReceipt={loadConversations} />
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center">
        <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">选择一个会话开始聊天</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-full border rounded-lg overflow-hidden bg-background">
      {/* Mobile: 堆叠切换 */}
      <div className="md:hidden w-full h-full">
        {selectedUserId ? conversation : list}
      </div>
      {/* Desktop: 双栏 */}
      <div className="hidden md:flex w-64 border-r shrink-0">{list}</div>
      <div className="hidden md:block flex-1">{conversation}</div>
    </div>
  );
};
