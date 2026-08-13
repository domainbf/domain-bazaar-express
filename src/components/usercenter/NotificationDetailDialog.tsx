import { Link } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bell } from 'lucide-react';

export interface NotificationDetail {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  action_url?: string | null;
  is_read?: boolean;
}

interface Props {
  notification: NotificationDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_LABEL: Record<string, string> = {
  offer: '报价', transaction: '交易', message: '消息', dispute: '纠纷',
  escrow: '托管', auction: '拍卖', verification: '认证', system: '系统',
};

export const NotificationDetailDialog = ({ notification, open, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-left">
          <Bell className="w-4 h-4 shrink-0" />
          <span className="break-all">{notification?.title}</span>
        </DialogTitle>
        <DialogDescription className="flex items-center gap-2 pt-1">
          <Badge variant="secondary">{TYPE_LABEL[notification?.type || ''] || '通知'}</Badge>
          <span className="text-xs">
            {notification ? new Date(notification.created_at).toLocaleString('zh-CN') : ''}
          </span>
        </DialogDescription>
      </DialogHeader>

      <p className="text-sm whitespace-pre-wrap break-words">{notification?.message}</p>

      {notification?.action_url && (
        <Button size="sm" asChild onClick={() => onOpenChange(false)}>
          <Link to={notification.action_url}>
            前往处理 <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
      )}
    </DialogContent>
  </Dialog>
);
