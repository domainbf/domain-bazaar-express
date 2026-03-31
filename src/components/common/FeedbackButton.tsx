import { useState, useRef } from 'react';
import { MessageSquarePlus, X, Send, CheckCircle, Image, Trash2, Upload } from 'lucide-react';
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
import { toast } from 'sonner';

type FeedbackType = 'bug' | 'suggestion' | 'complaint' | 'other';

const TYPE_OPTIONS: { value: FeedbackType; label: string; icon: string }[] = [
  { value: 'bug',        label: 'Bug 反馈',  icon: '🐛' },
  { value: 'suggestion', label: '功能建议',  icon: '💡' },
  { value: 'complaint',  label: '投诉建议',  icon: '📢' },
  { value: 'other',      label: '其他反馈',  icon: '💬' },
];

const MAX_SCREENSHOTS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface UploadedFile {
  preview: string;
  url: string;
  uploading: boolean;
  error?: string;
}

export function FeedbackButton() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleOpen = () => {
    setEmail(user?.email || '');
    setDone(false);
    setFiles([]);
    setSubject('');
    setMessage('');
    setType('bug');
    setOpen(true);
  };

  const handleClose = () => {
    if (submitting) return;
    setOpen(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    e.target.value = '';

    const remaining = MAX_SCREENSHOTS - files.length;
    const toAdd = selected.slice(0, remaining);

    for (const file of toAdd) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} 格式不支持，仅限 JPG/PNG/GIF/WebP`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} 超过 5MB 限制`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      const placeholder: UploadedFile = { preview, url: '', uploading: true };

      setFiles(prev => [...prev, placeholder]);

      const form = new FormData();
      form.append('file', file);

      try {
        const res = await fetch('/api/data/feedback/upload', {
          method: 'POST',
          body: form,
        });
        const json = await res.json();
        if (!res.ok || !json.url) {
          setFiles(prev => prev.map(f => f.preview === preview
            ? { ...f, uploading: false, error: json.error || '上传失败' }
            : f
          ));
          toast.error(json.error || '截图上传失败');
        } else {
          setFiles(prev => prev.map(f => f.preview === preview
            ? { ...f, url: json.url, uploading: false }
            : f
          ));
        }
      } catch {
        setFiles(prev => prev.map(f => f.preview === preview
          ? { ...f, uploading: false, error: '上传失败' }
          : f
        ));
        toast.error('截图上传失败，请检查网络');
      }
    }
  };

  const removeFile = (preview: string) => {
    setFiles(prev => {
      const f = prev.find(f => f.preview === preview);
      if (f) URL.revokeObjectURL(f.preview);
      return prev.filter(f => f.preview !== preview);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (files.some(f => f.uploading)) {
      toast.error('截图还在上传中，请稍候');
      return;
    }
    setSubmitting(true);
    try {
      const successScreenshots = files.filter(f => f.url && !f.error).map(f => f.url);
      await apiPost('/data/feedback', {
        type,
        subject: subject.trim() || undefined,
        message: message.trim(),
        url: window.location.href,
        userId: user?.id,
        userEmail: email.trim() || user?.email,
        browser: navigator.userAgent,
        timestamp: new Date().toISOString(),
        screenshots: successScreenshots,
      });
      setDone(true);
      setTimeout(() => setOpen(false), 2400);
    } catch {
      toast.error('反馈发送失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const uploading = files.some(f => f.uploading);
  const canAddMore = files.length < MAX_SCREENSHOTS;

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

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                      <Label htmlFor="fb-email">邮箱（选填）</Label>
                      <Input
                        id="fb-email"
                        type="email"
                        placeholder="your@email.com"
                        autoComplete="email"
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

                {/* Screenshot upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <Image className="h-3.5 w-3.5" />
                      截图附件（最多 {MAX_SCREENSHOTS} 张）
                    </Label>
                    <span className="text-xs text-muted-foreground">{files.length}/{MAX_SCREENSHOTS}</span>
                  </div>

                  {files.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {files.map((f) => (
                        <div key={f.preview} className="relative group">
                          <div className={`w-20 h-16 rounded-lg border overflow-hidden bg-muted/50 ${f.error ? 'border-destructive' : 'border-border'}`}>
                            <img
                              src={f.preview}
                              alt="截图预览"
                              className={`w-full h-full object-cover ${f.uploading ? 'opacity-50' : ''}`}
                            />
                            {f.uploading && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            {f.error && (
                              <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                                <span className="text-[9px] text-destructive font-medium px-1 text-center">上传失败</span>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(f.preview)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {canAddMore && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        点击上传截图（JPG/PNG/GIF，≤5MB）
                      </button>
                    </>
                  )}
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  当前页面：<span className="font-mono">{window.location.pathname}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                    disabled={submitting}
                  >
                    <X className="h-4 w-4 mr-1" />
                    取消
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting || !message.trim() || uploading}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {submitting ? '发送中...' : uploading ? '上传中...' : '提交反馈'}
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
