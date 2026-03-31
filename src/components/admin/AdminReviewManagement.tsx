import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPatch, apiDelete } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { RefreshCw, Search, Star, Eye, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

interface Review {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  transaction_id: string | null;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
  reviewer_name?: string;
  reviewed_name?: string;
}

export const AdminReviewManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selected, setSelected] = useState<Review | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any[]>('/data/admin/reviews');
      const rows = Array.isArray(data) ? data : [];
      const mapped: Review[] = rows.map((r: any) => ({
        ...r,
        reviewer_name: r.reviewer?.contact_email ?? r.reviewer?.full_name ?? '—',
        reviewed_name: r.reviewed_user_id ?? '—',
      }));
      setReviews(mapped);
    } catch {
      toast.error('加载评价失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const toggleVisibility = async (id: string, visible: boolean) => {
    try {
      await apiPatch(`/data/admin/reviews/${id}`, { is_visible: visible });
      toast.success(visible ? '评价已恢复显示' : '评价已隐藏');
      loadReviews();
      setShowDetail(false);
    } catch {
      toast.error('操作失败');
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm('确认删除该评价？此操作不可撤销。')) return;
    try {
      await apiDelete(`/data/admin/reviews/${id}`);
      toast.success('评价已删除');
      loadReviews();
      setShowDetail(false);
    } catch {
      toast.error('删除失败');
    }
  };

  const filtered = reviews.filter(r => {
    const matchRating = ratingFilter === 'all' || r.rating.toString() === ratingFilter;
    const s = search.toLowerCase();
    const matchSearch = !s || r.reviewer_name?.toLowerCase().includes(s) || r.reviewed_name?.toLowerCase().includes(s) || r.comment?.toLowerCase().includes(s);
    return matchRating && matchSearch;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">评价管理</h2>
          <p className="text-sm text-muted-foreground">审核和管理用户交易评价</p>
        </div>
        <Button onClick={loadReviews} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />刷新
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '全部评价', value: reviews.length },
          { label: '平均评分', value: `${avgRating}★` },
          { label: '好评 (4-5星)', value: reviews.filter(r => r.rating >= 4).length },
          { label: '已隐藏', value: reviews.filter(r => !r.is_visible).length },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="搜索用户名或评价内容..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="评分筛选" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部评分</SelectItem>
            {[5, 4, 3, 2, 1].map(r => (
              <SelectItem key={r} value={r.toString()}>{r}星</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">暂无评价</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>评价人</TableHead>
                    <TableHead>被评价人</TableHead>
                    <TableHead>评分</TableHead>
                    <TableHead>评价内容</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id} className={`hover:bg-muted/50 ${!r.is_visible ? 'opacity-50' : ''}`}>
                      <TableCell className="text-sm font-medium">{r.reviewer_name}</TableCell>
                      <TableCell className="text-sm">{r.reviewed_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{r.comment ?? '（无文字评价）'}</p>
                      </TableCell>
                      <TableCell>
                        {r.is_visible
                          ? <Badge className="text-xs bg-green-500/15 text-green-700">已显示</Badge>
                          : <Badge variant="secondary" className="text-xs">已隐藏</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button size="sm" variant="ghost" onClick={() => { setSelected(r); setShowDetail(true); }}>
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

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>评价详情</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">评价人：</span>{selected.reviewer_name}</div>
                <div><span className="text-muted-foreground">被评价人：</span>{selected.reviewed_name}</div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">评分：</span>
                  <span className="inline-flex items-center gap-0.5 ml-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < selected.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                    ))}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block mb-1">评价内容：</span>
                  <p className="bg-muted rounded p-3 text-sm">{selected.comment ?? '（无文字评价）'}</p>
                </div>
                <div><span className="text-muted-foreground">发布时间：</span>{new Date(selected.created_at).toLocaleString('zh-CN')}</div>
                <div><span className="text-muted-foreground">显示状态：</span>{selected.is_visible ? '已显示' : '已隐藏'}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selected.is_visible ? 'outline' : 'default'}
                  onClick={() => toggleVisibility(selected.id, !selected.is_visible)}
                >
                  {selected.is_visible
                    ? <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" />隐藏评价</>
                    : <><CheckCircle className="h-3.5 w-3.5 mr-1.5" />恢复显示</>
                  }
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteReview(selected.id)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />删除评价
                </Button>
              </div>
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
