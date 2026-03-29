import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ParsedDomain {
  name: string;
  price: number | null;
  description: string;
  category: string;
  valid: boolean;
  error?: string;
}

interface BulkDomainImportProps {
  onSuccess?: () => void;
}

function parseDomainName(raw: string): boolean {
  const trimmed = raw.trim().toLowerCase();
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(trimmed);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): ParsedDomain[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('domain') || firstLine.includes('name') || firstLine.includes('域名');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line, idx) => {
    const cols = parseCSVLine(line);
    const rawName = (cols[0] || '').replace(/^["']|["']$/g, '').trim();
    const rawPrice = cols[1] ? parseFloat(cols[1].replace(/[^0-9.]/g, '')) : null;
    const description = cols[2] || '';
    const category = cols[3] || 'other';

    if (!rawName) {
      return { name: '', price: null, description, category, valid: false, error: `第${idx + 2}行：域名为空` };
    }
    if (!parseDomainName(rawName)) {
      return { name: rawName, price: null, description, category, valid: false, error: `第${idx + 2}行：无效域名格式 "${rawName}"` };
    }
    if (rawPrice !== null && (isNaN(rawPrice) || rawPrice < 0)) {
      return { name: rawName, price: null, description, category, valid: false, error: `第${idx + 2}行：无效价格 "${cols[1]}"` };
    }

    return { name: rawName, price: rawPrice, description, category, valid: true };
  });
}

export const BulkDomainImport = ({ onSuccess }: BulkDomainImportProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState<ParsedDomain[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setParsed(parseCSV(text));
      setImportResult(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleTextChange = (value: string) => {
    setCsvText(value);
    if (value.trim()) {
      setParsed(parseCSV(value));
    } else {
      setParsed([]);
    }
    setImportResult(null);
  };

  const validDomains = parsed.filter(d => d.valid);
  const invalidDomains = parsed.filter(d => !d.valid);

  const handleImport = async () => {
    if (!user || validDomains.length === 0) return;
    setImporting(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    const batchSize = 10;
    for (let i = 0; i < validDomains.length; i += batchSize) {
      const batch = validDomains.slice(i, i + batchSize);
      const rows = batch.map(d => ({
        name: d.name.toLowerCase(),
        price: d.price,
        description: d.description || null,
        category: d.category || 'other',
        user_id: user.id,
        status: 'available',
        currency: 'CNY',
        listing_type: 'fixed',
      }));

      const { error } = await supabase.from('domain_listings').insert(rows);
      if (error) {
        failed += batch.length;
      } else {
        success += batch.length;
      }
      setProgress(Math.round(((i + batchSize) / validDomains.length) * 100));
    }

    setProgress(100);
    setImporting(false);
    setImportResult({ success, failed });

    if (success > 0) {
      toast.success(`成功导入 ${success} 个域名`);
      if (failed === 0) {
        setTimeout(() => {
          setOpen(false);
          setCsvText('');
          setParsed([]);
          setImportResult(null);
          onSuccess?.();
        }, 1500);
      }
      onSuccess?.();
    }
    if (failed > 0) {
      toast.error(`${failed} 个域名导入失败`);
    }
  };

  const downloadTemplate = () => {
    const header = 'domain,price,description,category\n';
    const rows = [
      'example.com,9999,优质短域名,technology',
      'mystore.cn,4999,电商品牌域名,business',
      'coolapp.io,2999,应用程序域名,technology',
    ].join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'domain_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setCsvText('');
      setParsed([]);
      setImportResult(null);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          批量导入
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            批量导入域名
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              支持 CSV 格式，列顺序：<strong>域名, 价格, 描述, 分类</strong>。价格和描述可留空。
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              选择 CSV 文件
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              下载模板
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">或直接粘贴 CSV 内容：</p>
            <Textarea
              placeholder={"domain,price,description,category\nexample.com,9999,优质域名,technology\nmysite.cn,4999,,business"}
              value={csvText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="font-mono text-sm h-36 resize-none"
              data-testid="textarea-csv-input"
            />
          </div>

          {parsed.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium">解析结果：</span>
                {validDomains.length > 0 && (
                  <Badge variant="outline" className="text-green-600 border-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {validDomains.length} 个有效
                  </Badge>
                )}
                {invalidDomains.length > 0 && (
                  <Badge variant="outline" className="text-red-500 border-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {invalidDomains.length} 个无效
                  </Badge>
                )}
              </div>

              {invalidDomains.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="text-xs mt-1 space-y-0.5">
                      {invalidDomains.slice(0, 5).map((d, i) => (
                        <li key={i}>{d.error}</li>
                      ))}
                      {invalidDomains.length > 5 && <li>…还有 {invalidDomains.length - 5} 个错误</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validDomains.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground grid grid-cols-3 gap-2">
                    <span>域名</span>
                    <span>价格 (¥)</span>
                    <span>分类</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y">
                    {validDomains.slice(0, 50).map((d, i) => (
                      <div key={i} className="px-3 py-1.5 text-sm grid grid-cols-3 gap-2">
                        <span className="font-mono text-xs">{d.name}</span>
                        <span>{d.price != null ? `¥${d.price.toLocaleString()}` : '—'}</span>
                        <span className="text-muted-foreground">{d.category}</span>
                      </div>
                    ))}
                    {validDomains.length > 50 && (
                      <div className="px-3 py-1.5 text-xs text-muted-foreground">…还有 {validDomains.length - 50} 条</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>正在导入…</span>
                <span>{Math.min(progress, 100)}%</span>
              </div>
              <Progress value={Math.min(progress, 100)} />
            </div>
          )}

          {importResult && (
            <Alert variant={importResult.failed === 0 ? 'default' : 'destructive'}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                导入完成：{importResult.success} 个成功
                {importResult.failed > 0 && `，${importResult.failed} 个失败（可能是域名已存在）`}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>取消</Button>
            <Button
              onClick={handleImport}
              disabled={validDomains.length === 0 || importing}
              data-testid="button-start-import"
            >
              {importing ? '导入中…' : `导入 ${validDomains.length} 个域名`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
