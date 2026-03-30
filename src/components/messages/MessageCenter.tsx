import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Send, User } from 'lucide-react';
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
}

export const MessageCenter = ({ otherUserId, transactionId, domainId, offerId }: MessageCenterProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState<OtherUserProfile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !otherUserId) return;
    loadMessages();
    loadOtherUser();

    useRealtimeSubscription(
    ["messages"],
    (_event) => { loadMessages(); },
    true
  );

    
  }, [user, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data ?? []) as Message[]);

      const unread = (data ?? []).filter((m: Message) => m.receiver_id === user?.id && !m.is_read);
      unread.forEach((m: Message) => markAsRead(m.id));
    } catch {
      toast.error('加载消息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOtherUser = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', otherUserId)
      .single();
    if (data) setOtherUser(data as OtherUserProfile);
  };

  const markAsRead = async (messageId: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', messageId);
  };

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

      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        receiver_id: otherUserId,
        content,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMsg]);

      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'message',
        title: '收到新消息',
        message: content.length > 50 ? content.slice(0, 50) + '...' : content,
        data: { sender_id: user.id, transaction_id: transactionId },
      });
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
                  <span className="text-xs text-muted-foreground mt-1 px-1">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: zhCN })}
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
        />
        <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending} size="icon" data-testid="button-send-message">
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

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (!msgs) return;

      const convMap = new Map<string, { lastMessage: string; lastTime: string; unread: number }>();
      msgs.forEach((m: Message) => {
        const otherId = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            lastMessage: m.content,
            lastTime: m.created_at,
            unread: !m.is_read && m.receiver_id === user?.id ? 1 : 0,
          });
        } else if (!m.is_read && m.receiver_id === user?.id) {
          const existing = convMap.get(otherId)!;
          convMap.set(otherId, { ...existing, unread: existing.unread + 1 });
        }
      });

      const userIds = Array.from(convMap.keys());
      if (userIds.length === 0) { setIsLoading(false); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      const convList = userIds.map(uid => {
        const profile = profiles?.find(p => p.id === uid);
        const conv = convMap.get(uid)!;
        return {
          userId: uid,
          userName: profile?.full_name ?? profile?.username ?? '未知用户',
          ...conv,
        };
      });

      setConversations(convList);
    } catch {
      toast.error('加载会话失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full border rounded-lg overflow-hidden">
      <div className="w-64 border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <p className="font-semibold text-sm">消息</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">暂无会话</p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.userId}
                className={`w-full text-left p-3 border-b hover:bg-muted/40 transition-colors ${selectedUserId === conv.userId ? 'bg-muted' : ''}`}
                onClick={() => setSelectedUserId(conv.userId)}
                data-testid={`conversation-${conv.userId}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{conv.userName}</span>
                  {conv.unread > 0 && (
                    <span className="bg-foreground text-background text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
              </button>
            ))
          )}
        </div>
      </div>
      <div className="flex-1">
        {selectedUserId ? (
          <MessageCenter otherUserId={selectedUserId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">选择一个会话开始聊天</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
