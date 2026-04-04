import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPatch } from '@/lib/apiClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Bug, Lightbulb, Megaphone, MessageCircle, RefreshCw,
  ChevronDown, ChevronUp, User, Globe, Monitor, Clock,
  CheckCircle, Eye, Loader2, ImageIcon, X
} from 'lucide-react';

interface Feedback {
  id: string;
  type: string;
  subject: string | null;
  message: string;
  url: string | null;
  user_id: string | null;
  user_email: string | null;
  browser: string | null;
  screenshots: string[];
  status: 'new' | 'seen' | 'resolved';
  admin_note: string | null;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Bug; color: string; badgeClass: string }> = {
  bug:        { label: 'Bug 反馈',  icon: Bug,           color: 'text-red-600',    badgeClass: 'bg-red-50 text-red-600 border-red-200' },
  suggestion: { label: '功能建议',  icon: Lightbulb,      color: 'text-blue-600',   badgeClass: 'bg-blue-50 text-blue-600 border-blue-200' },
  complaint:  { label: '投诉建议',  icon: Megaphone,      color: 'text-orange-600', badgeClass: 'bg-orange-50 text-orange-600 border-orange-200' },
  other:      { label: '其他反馈',  icon: MessageCircle,  color: 'text-green-600',  badgeClass: 'bg-green-50 text-green-600 border-green-200' },
};

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  new:      { label: '未处理', badgeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  seen:     { label: '已查看', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved: { label: '已解决', badgeClass: 'bg-green-50 text-green-700 border-green-200' },
};

function FeedbackItem({
  item,
  onUpdate,
}: {
  item: Feedback;
  onUpdate: (id: string, patch: Partial<Feedback>) => void;
}) {
  const [expanded, setExpanded] = useState(item.status === 'new');
  const [note, setNote] = useState(item.admin_note || '');
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
  const TypeIcon = typeCfg.icon;

  const markAs = async (status: 'seen' | 'resolved') => {
    setSaving(true);
    try {
      await apiPatch(`/data/admin/feedback/${item.id}`, { status });
      onUpdate(item.id, { status });
      toast.success(status === 'resolved' ? '已标记为已解决' : '已标记为已查看');
    } catch {
      toast.error('操作失败');
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    setSaving(true);
    try {
      await apiPatch(`/data/admin/feedback/${item.id}`, { admin_note: note });
      onUpdate(item.id, { admin_note: note });
      toast.success('备注已保存');
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const timeStr = new Date(item.created_at).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewUrl}
            alt="截图预览"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div className={`border rounded-xl overflow-hidden ${item.status === 'new' ? 'border-yellow-300 shadow-sm' : 'border-border'}`}>
        {/* Header */}
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
          onClick={() => setExpanded(v => !v)}
        >
          <TypeIcon className={`h-4 w-4 shrink-0 ${typeCfg.color}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm truncate">
                {item.subject || item.message.substring(0, 50)}
              </span>
              <Badge className={`text-xs border px-2 py-0 ${typeCfg.badgeClass}`}>
                {typeCfg.label}
              </Badge>
              <Badge className={`text-xs border px-2 py-0 ${statusCfg.badgeClass}`}>
                {statusCfg.label}
              </Badge>
              {item.screenshots.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ImageIcon className="h-3 w-3" />
                  {item.screenshots.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              {item.user_email && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.user_email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeStr}
              </span>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 border-t bg-muted/20 space-y-4 pt-3">
            {/* Message */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">详细描述</p>
              <div className="bg-background border rounded-lg px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                {item.message}
              </div>
            </div>

            {/* Screenshots */}
            {item.screenshots.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  截图附件（{item.screenshots.length} 张）
                </p>
                <div className="flex gap-2 flex-wrap">
                  {item.screenshots.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreviewUrl(url)}
                      className="w-24 h-18 rounded-lg border overflow-hidden hover:opacity-90 hover:ring-2 hover:ring-primary transition-all"
                    >
                      <img
                        src={url}
                        alt={`截图 ${i + 1}`}
                        className="w-full h-full object-cover"
                        style={{ height: 72 }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Meta info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {item.url && (
                <div className="flex items-start gap-2 text-sm">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground break-all">{item.url}</span>
                </div>
              )}
              {item.browser && (
                <div className="flex items-start gap-2 text-sm">
                  <Monitor className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground truncate text-xs">{item.browser}</span>
                </div>
              )}
            </div>

            {/* Admin note */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                管理员备注
              </Label>
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="添加处理备注（仅管理员可见）..."
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {item.status !== 'seen' && item.status !== 'resolved' && (
                <Button size="sm" variant="outline" onClick={() => markAs('seen')} disabled={saving}>
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  标记已查看
                </Button>
              )}
              {item.status !== 'resolved' && (
                <Button size="sm" variant="outline" onClick={() => markAs('resolved')} disabled={saving}
                  className="text-green-700 border-green-300 hover:bg-green-50">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  标记已解决
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={saveNote}
                disabled={saving || note === (item.admin_note || '')}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                保存备注
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function AdminFeedback({ onBadgeRefresh }: { onBadgeRefresh?: () => void }) {
  const [items, setItems] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const off = reset ? 0 : offset;
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) });
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      const data = await apiGet<any>(`/data/admin/feedback?${params}`);
      if (reset) {
        setItems(data.items || []);
        setOffset(0);
      } else {
        setItems(prev => [...prev, ...(data.items || [])]);
      }
      setTotal(data.total || 0);
      onBadgeRefresh?.();
    } catch {
      toast.error('加载反馈列表失败');
    } finally {
      setLoading(false);
    }
  }, [offset, filterStatus, filterType]);

  useEffect(() => {
    load(true);
  }, [filterStatus, filterType]);

  const handleUpdate = (id: string, patch: Partial<Feedback>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
    if (patch.status) onBadgeRefresh?.();
  };

  const loadMore = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
  };

  useEffect(() => {
    if (offset > 0) load(false);
  }, [offset]);

  const newCount = items.filter(i => i.status === 'new').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">用户反馈</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            共 {total} 条反馈
            {newCount > 0 && <span className="ml-2 text-yellow-600 font-medium">· {newCount} 条未处理</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(true)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterStatus || 'all'} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="new">未处理</SelectItem>
            <SelectItem value="seen">已查看</SelectItem>
            <SelectItem value="resolved">已解决</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType || 'all'} onValueChange={v => setFilterType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="bug">🐛 Bug 反馈</SelectItem>
            <SelectItem value="suggestion">💡 功能建议</SelectItem>
            <SelectItem value="complaint">📢 投诉建议</SelectItem>
            <SelectItem value="other">💬 其他反馈</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>暂无反馈记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <FeedbackItem key={item.id} item={item} onUpdate={handleUpdate} />
          ))}

          {items.length < total && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                加载更多（剩余 {total - items.length} 条）
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
