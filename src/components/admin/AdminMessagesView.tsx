import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/apiClient';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, MessageSquare, Globe, ArrowRight, Eye, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  domain_id: string | null;
  content: string;
  is_read: boolean | null;
  created_at: string | null;
  sender_name?: string;
  receiver_name?: string;
  domain_name?: string;
}

interface ConversationGroup {
  key: string;
  sender_id: string | null;
  receiver_id: string | null;
  sender_name: string;
  receiver_name: string;
  domain_name: string;
  domain_id: string | null;
  messages: Message[];
  unread_count: number;
  last_message: string;
  last_time: string;
}

export const AdminMessagesView = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const msgs = data || [];

      const userIds = [...new Set([
        ...msgs.map(m => m.sender_id).filter(Boolean),
        ...msgs.map(m => m.receiver_id).filter(Boolean),
      ])] as string[];

      const domainIds = [...new Set(msgs.map(m => m.domain_id).filter(Boolean))] as string[];

      const [profilesRes, domainsRes] = await Promise.allSettled([
        userIds.length > 0
          ? supabase.from('profiles').select('id, full_name, username').in('id', userIds)
          : Promise.resolve({ data: [], error: null }),
        domainIds.length > 0
          ? supabase.from('domain_listings').select('id, name').in('id', domainIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const profileMap: Record<string, string> = {};
      if (profilesRes.status === 'fulfilled' && profilesRes.value.data) {
        profilesRes.value.data.forEach((p: any) => {
          profileMap[p.id] = p.full_name || p.username || p.id.slice(0, 8);
        });
      }

      const domainMap: Record<string, string> = {};
      if (domainsRes.status === 'fulfilled' && domainsRes.value.data) {
        domainsRes.value.data.forEach((d: any) => {
          domainMap[d.id] = d.name;
        });
      }

      const enriched: Message[] = msgs.map(m => ({
        ...m,
        sender_name: m.sender_id ? (profileMap[m.sender_id] || '未知用户') : '系统',
        receiver_name: m.receiver_id ? (profileMap[m.receiver_id] || '未知用户') : '系统',
        domain_name: m.domain_id ? (domainMap[m.domain_id] || m.domain_id.slice(0, 8)) : '',
      }));

      setMessages(enriched);

      const convMap: Record<string, ConversationGroup> = {};
      enriched.forEach(m => {
        const key = [m.sender_id, m.receiver_id, m.domain_id].sort().join('-');
        if (!convMap[key]) {
          convMap[key] = {
            key,
            sender_id: m.sender_id,
            receiver_id: m.receiver_id,
            sender_name: m.sender_name || '',
            receiver_name: m.receiver_name || '',
            domain_name: m.domain_name || '',
            domain_id: m.domain_id,
            messages: [],
            unread_count: 0,
            last_message: '',
            last_time: '',
          };
        }
        convMap[key].messages.push(m);
        if (!m.is_read) convMap[key].unread_count++;
      });

      const convList = Object.values(convMap).map(c => {
        const sorted = [...c.messages].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        return {
          ...c,
          messages: sorted,
          last_message: sorted[0]?.content || '',
          last_time: sorted[0]?.created_at || '',
        };
      });

      convList.sort(
        (a, b) => new Date(b.last_time || 0).getTime() - new Date(a.last_time || 0).getTime()
      );

      setConversations(convList);
    } catch (error: any) {
      toast.error('加载消息失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('确定要删除这条消息吗？')) return;
    try {
      const { error } = await supabase.from('messages').delete().eq('id', msgId);
      if (error) throw error;
      toast.success('消息已删除');
      loadMessages();
    } catch (error: any) {
      toast.error('删除失败: ' + error.message);
    }
  };

  const formatTime = (t: string | null) => {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const filteredConvs = conversations.filter(c => {
    const matchSearch =
      !search ||
      c.sender_name.includes(search) ||
      c.receiver_name.includes(search) ||
      c.domain_name.includes(search) ||
      c.last_message.includes(search);
    const matchFilter =
      filter === 'all' ||
      (filter === 'unread' && c.unread_count > 0);
    return matchSearch && matchFilter;
  });

  const totalMessages = messages.length;
  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">消息管理</h2>
          <p className="text-muted-foreground">查看和管理用户之间的所有消息</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMessages}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalMessages}</p>
                <p className="text-xs text-muted-foreground">总消息数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">未读消息</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{conversations.length}</p>
                <p className="text-xs text-muted-foreground">对话总数</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-5 gap-4 h-[600px]">
        <div className="md:col-span-2 flex flex-col border rounded-lg overflow-hidden bg-background">
          <div className="p-3 border-b space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="搜索用户或内容..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  data-testid="input-msg-search"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="unread">未读</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              {search ? '未找到相关对话' : '暂无消息'}
            </div>
          ) : (
            <ScrollArea className="flex-1">
              {filteredConvs.map(conv => (
                <button
                  key={conv.key}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b ${
                    selectedConv?.key === conv.key ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                      <AvatarFallback className="text-xs">
                        {conv.sender_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {conv.sender_name} <ArrowRight className="inline h-3 w-3" /> {conv.receiver_name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-1">
                          {formatTime(conv.last_time)}
                        </span>
                      </div>
                      {conv.domain_name && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{conv.domain_name}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="h-4 text-xs px-1 shrink-0">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </ScrollArea>
          )}
        </div>

        <div className="md:col-span-3 flex flex-col border rounded-lg overflow-hidden bg-background">
          {selectedConv ? (
            <>
              <div className="p-3 border-b">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">
                    {selectedConv.sender_name} → {selectedConv.receiver_name}
                  </span>
                  {selectedConv.domain_name && (
                    <Badge variant="outline" className="text-xs">
                      <Globe className="h-2.5 w-2.5 mr-1" />
                      {selectedConv.domain_name}
                    </Badge>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    共 {selectedConv.messages.length} 条
                  </span>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {[...selectedConv.messages].reverse().map((msg, idx) => (
                    <div key={msg.id}>
                      {idx > 0 && <Separator className="my-2" />}
                      <div className="flex items-start gap-2 group">
                        <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                          <AvatarFallback className="text-xs">
                            {msg.sender_name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{msg.sender_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {msg.created_at ? new Date(msg.created_at).toLocaleString('zh-CN') : ''}
                            </span>
                            {!msg.is_read && (
                              <Badge variant="secondary" className="h-3 text-xs px-1">未读</Badge>
                            )}
                          </div>
                          <p className="text-sm mt-0.5 break-words">{msg.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={() => handleDeleteMessage(msg.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="h-12 w-12 opacity-30" />
              <p className="text-sm">选择左侧对话以查看消息详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
