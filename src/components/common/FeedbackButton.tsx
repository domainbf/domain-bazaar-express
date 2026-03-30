import { useState } from 'react';
import { MessageSquarePlus, X, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiPost } from '@/lib/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

type FeedbackType = 'bug' | 'suggestion' | 'complaint' | 'other';

const TYPE_OPTIONS: { value: FeedbackType; label: string; icon: string }[] = [
  { value: 'bug',        label: 'Bug 反馈',  icon: '🐛' },
  { value: 'suggestion', label: '功能建议',  icon: '💡' },
  { value: 'complaint',  label: '投诉建议',  icon: '📢' },
  { value: 'other',      label: '其他反馈',  icon: '💬' },
];

export function FeedbackButton() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleOpen = () => {
    setEmail(user?.email || '');
    setDone(false);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await apiPost('/data/feedback', {
        type,
        subject: subject.trim() || undefined,
        message: message.trim(),
        url: window.location.href,
        userId: user?.id,
        userEmail: email.trim() || user?.email,
        browser: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
      setDone(true);
      setSubject('');
      setMessage('');
      setType('bug');
      setTimeout(() => setOpen(false), 2200);
    } catch {
      setDone(false);
    } finally {
      setSubmitting(false);
    }
  };

  const bottomOffset = isMobile
    ? 'bottom-[calc(72px+env(safe-area-inset-bottom,0px)+12px)]'
    : 'bottom-6';

  return (
    <>
      <motion.button
        className={`fixed right-4 ${bottomOffset} z-40 flex items-center gap-2
          bg-foreground text-background rounded-full shadow-lg px-4 py-2.5
          text-sm font-medium hover:bg-foreground/90 active:scale-95
          transition-colors select-none`}
        onClick={handleOpen}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        aria-label="提交反馈"
      >
        <MessageSquarePlus className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">反馈</span>
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5" />
              意见反馈
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 gap-3"
              >
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-base font-semibold text-foreground">感谢您的反馈！</p>
                <p className="text-sm text-muted-foreground text-center">
                  您的反馈已发送给管理员，我们会尽快处理。
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-4 pt-1"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fb-type">反馈类型</Label>
                    <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
                      <SelectTrigger id="fb-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.icon} {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!user && (
                    <div className="space-y-1.5">
                      <Label htmlFor="fb-email">您的邮箱（选填）</Label>
                      <Input
                        id="fb-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fb-subject">主题（选填）</Label>
                  <Input
                    id="fb-subject"
                    placeholder="简短描述问题..."
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    maxLength={120}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fb-message">
                    详细描述 <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="fb-message"
                    placeholder={
                      type === 'bug'
                        ? '请描述遇到的问题，包括操作步骤和实际结果...'
                        : type === 'suggestion'
                        ? '请描述您希望增加的功能或改进点...'
                        : '请详细描述您的反馈...'
                    }
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    rows={4}
                    maxLength={2000}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/2000
                  </p>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  当前页面：<span className="font-mono">{window.location.pathname}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                  >
                    <X className="h-4 w-4 mr-1" />
                    取消
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting || !message.trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {submitting ? '发送中...' : '提交反馈'}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
