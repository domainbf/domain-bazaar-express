import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Bookmark, BookmarkPlus, Trash2, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
  notify_new: boolean;
}

interface Props {
  currentQuery: string;
  currentFilters: Record<string, any>;
  onApply: (query: string, filters: Record<string, any>) => void;
}

export const SavedSearches = ({ currentQuery, currentFilters, onApply }: Props) => {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [notifyNew, setNotifyNew] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems((data as SavedSearch[]) || []);
  };

  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!user) { toast.info('请先登录'); return; }
    if (!name.trim()) { toast.error('请填写名称'); return; }
    const { error } = await supabase.from('saved_searches').insert({
      user_id: user.id,
      name: name.trim(),
      query: currentQuery,
      filters: currentFilters,
      notify_new: notifyNew,
    });
    if (error) return toast.error('保存失败：' + error.message);
    toast.success('已保存搜索');
    setName(''); setNotifyNew(false); setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('saved_searches').delete().eq('id', id);
    if (error) return toast.error('删除失败');
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('已删除');
  };

  const toggleNotify = async (id: string, value: boolean) => {
    const { error } = await supabase.from('saved_searches').update({ notify_new: value }).eq('id', id);
    if (error) return toast.error('更新失败');
    setItems(prev => prev.map(i => i.id === id ? { ...i, notify_new: value } : i));
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" aria-label="保存当前搜索">
            <BookmarkPlus className="h-4 w-4 mr-1.5" />保存搜索
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>保存当前搜索</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="搜索名称（如：短域名 .com）" value={name} onChange={e => setName(e.target.value)} />
            <div className="text-xs text-muted-foreground rounded-lg bg-muted p-3 space-y-1">
              <div>关键词：<span className="font-mono">{currentQuery || '（无）'}</span></div>
              <div>筛选：<span className="font-mono">{Object.keys(currentFilters).length} 项</span></div>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={notifyNew} onCheckedChange={setNotifyNew} aria-label="新上架通知" />
              匹配条件下的新上架域名通知我
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={save}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {items.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {items.slice(0, 6).map(s => (
            <div key={s.id} className="group inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs">
              <button
                className="inline-flex items-center gap-1 hover:text-primary"
                onClick={() => onApply(s.query, s.filters)}
                aria-label={`应用搜索 ${s.name}`}
              >
                <Bookmark className="h-3 w-3" />{s.name}
              </button>
              {s.notify_new && <Bell className="h-3 w-3 text-primary" />}
              <button
                onClick={() => toggleNotify(s.id, !s.notify_new)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                aria-label={s.notify_new ? '关闭通知' : '开启通知'}
                title={s.notify_new ? '关闭通知' : '开启通知'}
              >
                <Bell className="h-3 w-3" />
              </button>
              <button
                onClick={() => remove(s.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                aria-label={`删除搜索 ${s.name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedSearches;
