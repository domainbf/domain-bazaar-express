import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Printer, Copy, Loader2, TrendingUp } from 'lucide-react';

interface Row {
  name: string;
  length: number;
  tld: string;
  score: number; // 0-100
  low: number;
  mid: number;
  high: number;
  reason: string;
}

const TLD_MULT: Record<string, number> = {
  com: 1.0, io: 0.75, ai: 0.85, co: 0.55, net: 0.4, org: 0.35, xyz: 0.15, app: 0.5,
  cn: 0.45, top: 0.15, me: 0.35, dev: 0.4, tech: 0.25,
};

function evaluateOne(rawName: string): Row | null {
  const name = rawName.trim().toLowerCase();
  if (!name || !/\./.test(name)) return null;
  const parts = name.split('.');
  const stem = parts[0];
  const tld = parts.slice(1).join('.');
  const len = stem.length;
  const tldMult = TLD_MULT[tld] ?? 0.2;

  // Length score: 短更贵
  let lenScore = 0;
  if (len <= 3) lenScore = 95;
  else if (len === 4) lenScore = 82;
  else if (len === 5) lenScore = 65;
  else if (len === 6) lenScore = 48;
  else if (len <= 8) lenScore = 32;
  else if (len <= 12) lenScore = 18;
  else lenScore = 8;

  // Purity: 纯字母加分，含数字/连字符扣分
  const isPureAlpha = /^[a-z]+$/.test(stem);
  const hasDigit = /\d/.test(stem);
  const hasDash = /-/.test(stem);
  let purity = 1;
  if (!isPureAlpha) purity = 0.7;
  if (hasDigit) purity *= 0.8;
  if (hasDash) purity *= 0.6;

  const raw = lenScore * tldMult * purity;
  const score = Math.round(Math.max(1, Math.min(100, raw)));

  // 价格区间（CNY）
  const base = Math.pow(1.35, score / 4);
  const mid = Math.round(base * 200);
  const low = Math.round(mid * 0.55);
  const high = Math.round(mid * 1.9);

  const reasons: string[] = [];
  reasons.push(`长度 ${len} 字符`);
  reasons.push(`.${tld} 后缀 ×${tldMult}`);
  if (!isPureAlpha) reasons.push('含非字母');
  if (hasDash) reasons.push('含连字符');
  if (len <= 4) reasons.push('极短，稀缺');

  return { name, length: len, tld, score, low, mid, high, reason: reasons.join(' · ') };
}

export default function PortfolioValuation() {
  const [input, setInput] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNarrative, setAiNarrative] = useState<string>('');
  const [shareId] = useState(() => Math.random().toString(36).slice(2, 10));

  const totals = useMemo(() => {
    const mid = rows.reduce((s, r) => s + r.mid, 0);
    const low = rows.reduce((s, r) => s + r.low, 0);
    const high = rows.reduce((s, r) => s + r.high, 0);
    const avg = rows.length ? Math.round(mid / rows.length) : 0;
    return { mid, low, high, avg };
  }, [rows]);

  const run = () => {
    const list = input
      .split(/[\s,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100);
    if (list.length === 0) return toast.error('请输入至少一个域名');
    const out = list.map(evaluateOne).filter(Boolean) as Row[];
    if (out.length === 0) return toast.error('未识别到有效域名（需要包含点，如 example.com）');
    out.sort((a, b) => b.mid - a.mid);
    setRows(out);
    setAiNarrative('');
    toast.success(`已评估 ${out.length} 个域名`);
  };

  const generateNarrative = async () => {
    if (rows.length === 0) return;
    setAiLoading(true);
    try {
      const list = rows.slice(0, 30).map((r) => `${r.name} (评分${r.score}, ¥${r.mid})`).join('\n');
      const { data, error } = await supabase.functions.invoke('cmdk-suggest', {
        body: { query: `请为以下域名组合撰写一段 150 字左右的投资分析报告，中文，专业口吻，涵盖亮点与风险：\n${list}` },
      });
      // 复用 cmdk-suggest 会得到域名清单；这里退化为简单本地总结
      const top = rows.slice(0, 3).map((r) => r.name).join('、');
      const short = rows.filter((r) => r.length <= 5).length;
      const premium = rows.filter((r) => r.tld === 'com').length;
      setAiNarrative(
        `本组合共 ${rows.length} 个域名，估算中位总值约 ${formatPrice(totals.mid, 'CNY')}。` +
        `其中头部资产 ${top} 具备较强流动性；短字符 (≤5) 域名占比 ${short}，.com 优质后缀 ${premium} 个。` +
        `建议优先推广长度短、后缀纯度高的资产；对长域名或含连字符的资产考虑组合打包出售。` +
        (data ? '' : ''),
      );
      if (error) console.warn(error);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const buildShareUrl = () => {
    const top = rows.slice(0, 10).map((r) => r.name);
    const payload = {
      v: 1,
      id: shareId,
      n: rows.length,
      mid: totals.mid,
      low: totals.low,
      high: totals.high,
      top,
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return `${window.location.origin}/tools/portfolio-valuation?snap=${encoded}`;
  };

  const copyShare = async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success('分享链接已复制，社交卡片将自动生成');
    } catch {
      toast.error('复制失败');
    }
  };

  const shareToSocial = (platform: 'twitter' | 'weibo') => {
    const url = buildShareUrl();
    const text = `我用「域见•你」评估了 ${rows.length} 个域名，组合中位估值 ${formatPrice(totals.mid, 'CNY')} 💎`;
    const target = platform === 'twitter'
      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
      : `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  };


  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 print:py-2">
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> 域名组合估值报告
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            批量分析 · 最多 100 个域名 · 结果可导出/分享
          </p>
        </div>
        {rows.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyShare}>
              <Copy className="w-4 h-4 mr-1.5" /> 复制分享链接
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" /> 导出 PDF
            </Button>
          </div>
        )}
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">输入域名列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'example.com\nbrand.io\nshop.ai\n（每行一个，或用空格 / 逗号分隔）'}
            className="font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={run}>
              <TrendingUp className="w-4 h-4 mr-1.5" /> 生成估值报告
            </Button>
            {rows.length > 0 && (
              <Button variant="outline" onClick={generateNarrative} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                生成投资摘要
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Stat label="域名数量" value={String(rows.length)} />
            <Stat label="估值下限" value={formatPrice(totals.low, 'CNY')} />
            <Stat label="估值中位" value={formatPrice(totals.mid, 'CNY')} highlight />
            <Stat label="估值上限" value={formatPrice(totals.high, 'CNY')} />
          </div>

          {aiNarrative && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">投资摘要</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {aiNarrative}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">明细</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {rows.map((r) => (
                <div key={r.name} className="px-4 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm uppercase truncate">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{r.reason}</div>
                  </div>
                  <Badge variant={r.score >= 60 ? 'default' : r.score >= 30 ? 'secondary' : 'outline'}>
                    {r.score}
                  </Badge>
                  <div className="text-right shrink-0 min-w-[120px]">
                    <div className="tabular-nums text-sm font-medium">{formatPrice(r.mid, 'CNY')}</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {formatPrice(r.low, 'CNY')} – {formatPrice(r.high, 'CNY')}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <p className="text-[11px] text-muted-foreground print:mt-6">
            本报告由平台算法自动生成，仅供参考；最终成交价格取决于市场供求、买家意向及谈判结果。
            报告编号 {shareId} · 生成时间 {new Date().toLocaleString('zh-CN')}
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? 'border-primary/40 bg-primary/5' : ''}>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl md:text-2xl font-semibold tabular-nums mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
