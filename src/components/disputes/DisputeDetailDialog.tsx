import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { uploadEvidence } from '@/lib/blobUpload';
import { Paperclip, X, Loader2 } from 'lucide-react';

interface DisputeRow {
  id: string;
  initiator_id: string;
  respondent_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  evidence_urls?: string[];
  seller_response?: string | null;
  seller_response_at?: string | null;
  seller_evidence_urls?: string[];
  resolution?: string | null;
  admin_notes?: string | null;
  created_at: string;
}

interface Props {
  dispute: DisputeRow | null;
  currentUserId?: string;
  isAdmin?: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

const STATUS_LABEL: Record<string, { label: string; tone: any }> = {
  open: { label: '待受理', tone: 'secondary' },
  in_review: { label: '审核中', tone: 'default' },
  resolved_buyer: { label: '申诉方胜诉', tone: 'default' },
  resolved_seller: { label: '被申诉方胜诉', tone: 'outline' },
  closed: { label: '已关闭', tone: 'outline' },
};

export function DisputeDetailDialog({ dispute, currentUserId, isAdmin, onClose, onUpdated }: Props) {
  const [response, setResponse] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  if (!dispute) return null;
  const meta = STATUS_LABEL[dispute.status] || { label: dispute.status, tone: 'outline' };
  const isRespondent = currentUserId && dispute.respondent_id === currentUserId;
  const canRespond = isRespondent && !dispute.seller_response;
  const isResolved = ['resolved_buyer', 'resolved_seller', 'closed'].includes(dispute.status);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadEvidence(f));
      setEvidence((prev) => [...prev, ...urls]);
    } catch (e: any) {
      toast.error(e.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const submitResponse = async () => {
    if (!response.trim()) return toast.error('请填写回应内容');
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('dispute-actions', {
        body: { action: 'seller_respond', dispute_id: dispute.id, response, evidence_urls: evidence },
      });
      if (error) throw error;
      toast.success('回应已提交');
      onUpdated?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message || '提交失败');
    } finally {
      setSaving(false);
    }
  };

  const resolve = async (verdict: 'buyer' | 'seller') => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('dispute-actions', {
        body: { action: 'admin_resolve', dispute_id: dispute.id, verdict, resolution, admin_notes: adminNotes },
      });
      if (error) throw error;
      toast.success('裁决已生效');
      onUpdated?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!dispute} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            争议详情 <Badge variant={meta.tone}>{meta.label}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">申诉原因</Label>
            <div className="font-medium mt-1">{dispute.reason}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">申诉描述</Label>
            <div className="whitespace-pre-wrap mt-1 p-3 bg-muted/40 rounded">{dispute.description}</div>
          </div>
          {(dispute.evidence_urls || []).length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">申诉方证据</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(dispute.evidence_urls || []).map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer" className="text-xs text-primary underline">附件 {i + 1}</a>
                ))}
              </div>
            </div>
          )}

          {dispute.seller_response && (
            <div className="border-t pt-3">
              <Label className="text-xs text-muted-foreground">被申诉方回应</Label>
              <div className="whitespace-pre-wrap mt-1 p-3 bg-muted/40 rounded">{dispute.seller_response}</div>
              {(dispute.seller_evidence_urls || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(dispute.seller_evidence_urls || []).map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noreferrer" className="text-xs text-primary underline">回应附件 {i + 1}</a>
                  ))}
                </div>
              )}
            </div>
          )}

          {canRespond && !isResolved && (
            <div className="border-t pt-3 space-y-2">
              <Label className="text-xs">您的回应</Label>
              <Textarea rows={4} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="请详细说明情况并上传证据" />
              <div>
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Paperclip className="w-3.5 h-3.5" /> 上传证据
                  <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => upload(e.target.files)} />
                </label>
                {uploading && <span className="text-xs text-muted-foreground ml-2"><Loader2 className="w-3 h-3 inline animate-spin" /> 上传中…</span>}
                {evidence.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {evidence.map((u, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                        附件 {i + 1}
                        <button onClick={() => setEvidence((p) => p.filter((_, x) => x !== i))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={submitResponse} disabled={saving} className="w-full">提交回应</Button>
            </div>
          )}

          {isAdmin && !isResolved && (
            <div className="border-t pt-3 space-y-2">
              <Label className="text-xs">裁决说明（对双方可见）</Label>
              <Textarea rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="请说明裁决依据与结论" />
              <Label className="text-xs">内部备注（仅管理员可见）</Label>
              <Textarea rows={2} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={() => resolve('buyer')} disabled={saving} className="flex-1">支持申诉方</Button>
                <Button onClick={() => resolve('seller')} disabled={saving} variant="outline" className="flex-1">支持被申诉方</Button>
              </div>
            </div>
          )}

          {isResolved && dispute.resolution && (
            <div className="border-t pt-3">
              <Label className="text-xs text-muted-foreground">裁决结论</Label>
              <div className="whitespace-pre-wrap mt-1 p-3 bg-primary/5 border border-primary/20 rounded">{dispute.resolution}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DisputeDetailDialog;
