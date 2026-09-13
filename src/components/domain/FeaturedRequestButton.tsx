import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { FEATURED_REQUESTS_KEY, FeaturedRequestStatus, useMyFeaturedRequests } from '@/hooks/useFeaturedRequests';

interface Props {
  domainId: string;
  domainName: string;
  size?: 'sm' | 'default';
}

const STATUS_LABEL: Record<FeaturedRequestStatus, string> = {
  pending: '精选审核中',
  approved: '已进入精选',
  rejected: '精选未通过',
};

/** Seller-facing entry: apply for the homepage / marketplace featured slot. */
export const FeaturedRequestButton = ({ domainId, domainName, size = 'sm' }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: mine = [] } = useMyFeaturedRequests(user?.id);

  const latest = mine.find(r => r.domain_id === domainId);

  if (latest && latest.status !== 'rejected') {
    return (
      <Badge variant={latest.status === 'approved' ? 'default' : 'secondary'} className="whitespace-nowrap">
        {STATUS_LABEL[latest.status]}
      </Badge>
    );
  }

  const submit = async () => {
    if (!user) { toast.error('请先登录'); return; }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from('featured_requests').insert({
        domain_id: domainId,
        domain_name: domainName,
        requester_id: user.id,
        reason: reason.trim() || null,
        status: 'pending',
      });
      if (error) {
        if (String(error.message).includes('featured_requests_pending_unique')) {
          toast.error('该域名已有待审核的精选申请');
        } else if (String(error.code) === '42501') {
          toast.error('只能为自己名下的域名申请精选');
        } else {
          toast.error(`提交失败：${error.message}`);
        }
        return;
      }
      toast.success('精选申请已提交，管理员审核后会通知你');
      queryClient.invalidateQueries({ queryKey: FEATURED_REQUESTS_KEY });
      setReason('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size={size} className="gap-1" data-testid={`button-apply-featured-${domainId}`}>
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{latest?.status === 'rejected' ? '重新申请精选' : '申请精选'}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>申请精选位</DialogTitle>
          <DialogDescription>
            {domainName} 将提交给管理员审核，通过后会展示在首页与市场的精选域名位。
          </DialogDescription>
        </DialogHeader>
        {latest?.status === 'rejected' && latest.review_note && (
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            上次审核意见：{latest.review_note}
          </p>
        )}
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="简单说明域名亮点（可选）：品牌性、行业、历史成交等"
          rows={4}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>取消</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            提交申请
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
