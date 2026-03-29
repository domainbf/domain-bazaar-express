import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import { Gavel, Loader2 } from 'lucide-react';

interface CreateAuctionDialogProps {
  domainId: string;
  domainName: string;
  currentPrice: number;
  onCreated?: () => void;
}

export const CreateAuctionDialog = ({ domainId, domainName, currentPrice, onCreated }: CreateAuctionDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    starting_price: String(Math.round(currentPrice * 0.7) || 1000),
    reserve_price: String(currentPrice),
    bid_increment: '100',
    duration_hours: '72',
  });

  const handleCreate = async () => {
    if (!user) { toast.error('请先登录'); return; }
    const startPrice = parseFloat(form.starting_price);
    const reservePrice = parseFloat(form.reserve_price);
    const bidInc = parseFloat(form.bid_increment);
    const durationHours = parseInt(form.duration_hours);

    if (isNaN(startPrice) || startPrice <= 0) { toast.error('请输入有效的起拍价'); return; }
    if (isNaN(bidInc) || bidInc <= 0) { toast.error('请输入有效的加价幅度'); return; }
    if (isNaN(durationHours) || durationHours < 1 || durationHours > 720) { toast.error('拍卖时长应在 1~720 小时之间'); return; }

    setIsCreating(true);
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + durationHours * 3600 * 1000);

      const { error } = await supabase.from('domain_auctions').insert({
        domain_id: domainId,
        starting_price: startPrice,
        current_price: startPrice,
        reserve_price: isNaN(reservePrice) || reservePrice <= 0 ? null : reservePrice,
        bid_increment: bidInc,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        status: 'active',
        total_bids: 0,
      });

      if (error) throw error;

      await supabase.from('domain_listings').update({ status: 'premium' }).eq('id', domainId);

      toast.success(`「${domainName}」拍卖已创建，持续 ${durationHours} 小时`);
      setOpen(false);
      onCreated?.();
    } catch (e: any) {
      toast.error('创建失败：' + (e.message || '未知错误'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Gavel className="h-4 w-4" />
          发起拍卖
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            为「{domainName}」发起拍卖
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starting_price">起拍价（元）</Label>
              <Input
                id="starting_price"
                type="number"
                min="1"
                value={form.starting_price}
                onChange={(e) => setForm(f => ({ ...f, starting_price: e.target.value }))}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reserve_price">保留价（元，可选）</Label>
              <Input
                id="reserve_price"
                type="number"
                min="0"
                value={form.reserve_price}
                onChange={(e) => setForm(f => ({ ...f, reserve_price: e.target.value }))}
                placeholder="低于此价不成交"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bid_increment">最低加价幅度（元）</Label>
              <Input
                id="bid_increment"
                type="number"
                min="1"
                value={form.bid_increment}
                onChange={(e) => setForm(f => ({ ...f, bid_increment: e.target.value }))}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">拍卖时长（小时）</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="720"
                value={form.duration_hours}
                onChange={(e) => setForm(f => ({ ...f, duration_hours: e.target.value }))}
                placeholder="72"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            拍卖结束后，最高出价者即为成交买家。若最终出价低于保留价，拍卖不成交。
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>取消</Button>
          <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
            {isCreating ? '创建中...' : '确认发起'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
