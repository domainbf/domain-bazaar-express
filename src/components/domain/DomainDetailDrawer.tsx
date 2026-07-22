import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Copy,
  ShieldCheck,
  Eye,
  Heart,
  Inbox,
  Pencil,
  Globe,
  RefreshCw,
  Lock,
  EyeOff,
  Mail,
  ArrowRightLeft,
  Link2,
  Plug,
  Server,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { DomainListing } from '@/types/domain';

const STATUS_TONES: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/20',
  active: 'bg-success/10 text-success border-success/20',
  reserved: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  sold: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-primary/10 text-primary border-primary/20',
};

const statusLabel = (s?: string) =>
  ({
    available: '在售',
    active: '在售',
    reserved: '已预订',
    sold: '已售出',
    pending: '待审核',
  } as any)[s || ''] ?? (s || '未知');

// ── Local settings (toggles) persisted per domain ───────────────
interface DomainToggles {
  autoRenew: boolean;
  privacy: boolean;
  transferLock: boolean;
}
const toggleKey = (id: string) => `domain.toggles.${id}`;
const loadToggles = (id: string): DomainToggles => {
  try {
    const raw = localStorage.getItem(toggleKey(id));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { autoRenew: true, privacy: true, transferLock: true };
};

// ── DNS propagation checker ─────────────────────────────────────
type Resolver = { name: string; url: (host: string, type: string) => string };

const RESOLVERS: Resolver[] = [
  { name: 'Google', url: (h, t) => `https://dns.google/resolve?name=${encodeURIComponent(h)}&type=${t}` },
  { name: 'Cloudflare', url: (h, t) => `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(h)}&type=${t}` },
];

type DnsRow = {
  resolver: string;
  status: 'idle' | 'loading' | 'ok' | 'empty' | 'error';
  values: string[];
  ms?: number;
};

async function dohQuery(url: string): Promise<{ answers: string[]; ms: number }> {
  const started = performance.now();
  const res = await fetch(url, { headers: { accept: 'application/dns-json' } });
  const ms = Math.round(performance.now() - started);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const answers: string[] = (data?.Answer ?? [])
    .map((a: any) => String(a?.data ?? '').replace(/^"|"$/g, ''))
    .filter(Boolean);
  return { answers, ms };
}

// ─────────────────────────────────────────────────────────────

export function DomainDetailDrawer({
  domain,
  open,
  onOpenChange,
}: {
  domain: DomainListing | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [toggles, setToggles] = useState<DomainToggles>({ autoRenew: true, privacy: true, transferLock: true });
  const [dnsType, setDnsType] = useState<'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'CNAME'>('A');
  const [dnsRows, setDnsRows] = useState<DnsRow[]>([]);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [fwdEmail, setFwdEmail] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    if (domain) {
      setToggles(loadToggles(domain.id));
      setDnsRows([]);
      try {
        setFwdEmail(localStorage.getItem(`domain.fwdEmail.${domain.id}`) || '');
        setRedirectUrl(localStorage.getItem(`domain.redirect.${domain.id}`) || '');
      } catch {}
    }
  }, [domain?.id]);

  const persist = (patch: Partial<DomainToggles>) => {
    if (!domain) return;
    const next = { ...toggles, ...patch };
    setToggles(next);
    try {
      localStorage.setItem(toggleKey(domain.id), JSON.stringify(next));
    } catch {}
    toast.success('设置已保存');
  };

  const runDns = async () => {
    if (!domain) return;
    setDnsLoading(true);
    setDnsRows(RESOLVERS.map((r) => ({ resolver: r.name, status: 'loading', values: [] })));
    const results: DnsRow[] = await Promise.all(
      RESOLVERS.map(async (r) => {
        try {
          const { answers, ms } = await dohQuery(r.url(domain.name, dnsType));
          return {
            resolver: r.name,
            status: answers.length ? 'ok' : 'empty',
            values: answers,
            ms,
          };
        } catch (e: any) {
          return { resolver: r.name, status: 'error', values: [String(e?.message || 'error')] };
        }
      })
    );
    setDnsRows(results);
    setDnsLoading(false);
  };

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name).then(() => toast.success(`已复制 ${name}`));
  };

  const saveFwdEmail = () => {
    if (!domain) return;
    localStorage.setItem(`domain.fwdEmail.${domain.id}`, fwdEmail);
    toast.success('邮件转发已保存');
  };

  const saveRedirect = () => {
    if (!domain) return;
    localStorage.setItem(`domain.redirect.${domain.id}`, redirectUrl);
    toast.success('跳转规则已保存');
  };

  const symbol = domain?.currency === 'USD' ? '$' : '¥';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col">
        {domain && (
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center font-mono font-bold text-lg shrink-0">
                    {domain.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-xl truncate">{domain.name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-xs ${STATUS_TONES[domain.status || ''] || ''}`}>
                        {statusLabel(domain.status)}
                      </Badge>
                      {domain.is_verified && (
                        <span className="inline-flex items-center gap-1 text-xs text-success">
                          <ShieldCheck className="w-3 h-3" /> 已验证
                        </span>
                      )}
                    </SheetDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyName(domain.name)} title="复制域名">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Link to={`/domain/${encodeURIComponent(domain.name)}`}>
                    <Button variant="ghost" size="icon" title="打开完整详情页">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </SheetHeader>

              {/* Quick toggles */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { key: 'autoRenew', label: '自动续费', icon: RefreshCw, on: toggles.autoRenew },
                  { key: 'privacy', label: '隐私保护', icon: EyeOff, on: toggles.privacy },
                  { key: 'transferLock', label: '过户锁', icon: Lock, on: toggles.transferLock },
                ].map(({ key, label, icon: Icon, on }) => (
                  <button
                    key={key}
                    onClick={() => persist({ [key]: !on } as any)}
                    className={`group flex flex-col items-start gap-1.5 p-2.5 rounded-xl border transition-all ${
                      on
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className={`w-4 h-4 ${on ? 'text-primary' : 'text-muted-foreground'}`} />
                      <Switch checked={on} onCheckedChange={() => persist({ [key]: !on } as any)} className="pointer-events-none scale-75" />
                    </div>
                    <span className={`text-xs font-medium ${on ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-border overflow-x-auto scrollbar-hide">
                <TabsList className="h-11 w-max bg-transparent p-0 rounded-none gap-0">
                  {[
                    { v: 'overview', l: '概览', i: Info },
                    { v: 'renewal', l: '续费', i: Calendar },
                    { v: 'dns', l: 'DNS', i: Server },
                    { v: 'privacy', l: '隐私', i: EyeOff },
                    { v: 'transfer', l: '过户', i: ArrowRightLeft },
                    { v: 'email', l: '邮件转发', i: Mail },
                    { v: 'redirect', l: '跳转', i: Link2 },
                    { v: 'connections', l: '连接', i: Plug },
                  ].map(({ v, l, i: Icon }) => (
                    <TabsTrigger
                      key={v}
                      value={v}
                      className="h-11 px-3.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none text-xs gap-1.5"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {l}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {/* OVERVIEW */}
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">当前价格</div>
                    <div className="mt-1 text-3xl font-bold gradient-text tabular-nums">
                      {symbol}
                      {(Number(domain.price) || 0).toLocaleString()}
                    </div>
                    {domain.description && <p className="mt-2 text-sm text-muted-foreground">{domain.description}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <StatTile icon={Eye} value={domain.views ?? 0} label="浏览" />
                    <StatTile icon={Heart} value={domain.favorites ?? 0} label="收藏" />
                    <StatTile icon={Inbox} value={domain.offers ?? 0} label="报价" />
                  </div>

                  <MetaList
                    rows={[
                      ['类别', domain.category || '—'],
                      ['币种', domain.currency || 'CNY'],
                      ['上架时间', domain.created_at ? new Date(domain.created_at).toLocaleString() : '—'],
                    ]}
                  />

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link to={`/domain/${encodeURIComponent(domain.name)}`}>
                      <Button className="w-full bg-gradient-primary text-primary-foreground border-0">
                        <ExternalLink className="w-4 h-4 mr-1.5" /> 打开详情页
                      </Button>
                    </Link>
                    <Link to="/dashboard/classic">
                      <Button variant="outline" className="w-full">
                        <Pencil className="w-4 h-4 mr-1.5" /> 编辑
                      </Button>
                    </Link>
                  </div>
                </TabsContent>

                {/* RENEWAL */}
                <TabsContent value="renewal" className="mt-0 space-y-3">
                  <Row
                    label="自动续费"
                    hint="到期前自动续期，避免误失效"
                    control={<Switch checked={toggles.autoRenew} onCheckedChange={(v) => persist({ autoRenew: v })} />}
                  />
                  <MetaList
                    rows={[
                      ['注册商', '域见 · 托管'],
                      ['当前状态', statusLabel(domain.status)],
                      ['到期时间', '—'],
                      ['续费周期', '1 年'],
                    ]}
                  />
                  <Button className="w-full mt-2" variant="outline" onClick={() => toast('即将开放：续费流程')}>
                    立即续费
                  </Button>
                </TabsContent>

                {/* DNS */}
                <TabsContent value="dns" className="mt-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {(['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setDnsType(t)}
                          className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border transition-all ${
                            dnsType === t
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card text-foreground border-border hover:border-primary/40'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <Button size="sm" className="ml-auto" onClick={runDns} disabled={dnsLoading}>
                      {dnsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                      检查传播
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border overflow-hidden">
                    {dnsRows.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        <Globe className="w-6 h-6 mx-auto mb-2 opacity-40" />
                        点击"检查传播"跨多个公共解析器查询 {dnsType} 记录
                      </div>
                    ) : (
                      dnsRows.map((row) => (
                        <div key={row.resolver} className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border last:border-b-0">
                          <div className="flex items-center gap-2 shrink-0">
                            {row.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                            {row.status === 'ok' && <CheckCircle2 className="w-4 h-4 text-success" />}
                            {row.status === 'empty' && <Info className="w-4 h-4 text-muted-foreground" />}
                            {row.status === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
                            <div>
                              <div className="text-sm font-medium">{row.resolver}</div>
                              {row.ms != null && <div className="text-[10px] text-muted-foreground">{row.ms} ms</div>}
                            </div>
                          </div>
                          <div className="text-right min-w-0 flex-1">
                            {row.status === 'loading' ? (
                              <span className="text-xs text-muted-foreground">查询中…</span>
                            ) : row.status === 'empty' ? (
                              <span className="text-xs text-muted-foreground">无记录</span>
                            ) : (
                              <div className="space-y-0.5">
                                {row.values.map((v, i) => (
                                  <code key={i} className="block text-[11px] font-mono text-foreground truncate" title={v}>
                                    {v}
                                  </code>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    结果由 Google (dns.google) 与 Cloudflare (1.1.1.1) DoH 提供，展示不同解析器视角以判断全球传播状态。
                  </p>
                </TabsContent>

                {/* PRIVACY */}
                <TabsContent value="privacy" className="mt-0 space-y-3">
                  <Row
                    label="WHOIS 隐私保护"
                    hint="使用代理信息屏蔽注册人电话与邮箱"
                    control={<Switch checked={toggles.privacy} onCheckedChange={(v) => persist({ privacy: v })} />}
                  />
                  <div className="p-4 rounded-xl bg-muted/40 border border-border text-sm text-muted-foreground">
                    开启后，公开 WHOIS 查询将只显示"域见代理服务",
                    联系表单会转发到你的验证邮箱。你随时可以关闭。
                  </div>
                </TabsContent>

                {/* TRANSFER */}
                <TabsContent value="transfer" className="mt-0 space-y-3">
                  <Row
                    label="过户锁"
                    hint="锁定后必须先解锁才能转出，防止未授权转移"
                    control={<Switch checked={toggles.transferLock} onCheckedChange={(v) => persist({ transferLock: v })} />}
                  />
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1.5">授权码 (EPP)</div>
                    <div className="flex gap-2">
                      <Input readOnly value="•••• •••• •••• ••••" className="font-mono" />
                      <Button variant="outline" onClick={() => toast('已生成新的授权码')}>生成</Button>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" disabled={toggles.transferLock}>
                    {toggles.transferLock ? '已锁定 · 请先关闭过户锁' : '开始转出流程'}
                  </Button>
                </TabsContent>

                {/* EMAIL FORWARDING */}
                <TabsContent value="email" className="mt-0 space-y-3">
                  <div className="text-sm text-muted-foreground">
                    将 <code className="font-mono text-foreground">any@{domain.name}</code> 收到的邮件转发到你的邮箱。
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={fwdEmail}
                      onChange={(e) => setFwdEmail(e.target.value)}
                    />
                    <Button onClick={saveFwdEmail}>保存</Button>
                  </div>
                </TabsContent>

                {/* URL REDIRECT */}
                <TabsContent value="redirect" className="mt-0 space-y-3">
                  <div className="text-sm text-muted-foreground">
                    301 跳转 <code className="font-mono text-foreground">{domain.name}</code> 到指定 URL。
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://your-site.com"
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                    />
                    <Button onClick={saveRedirect}>保存</Button>
                  </div>
                </TabsContent>

                {/* CONNECTIONS */}
                <TabsContent value="connections" className="mt-0 space-y-2">
                  {[
                    { name: 'Vercel', desc: '一键部署前端项目到该域名', connected: false },
                    { name: 'Cloudflare', desc: '接管 DNS 与 CDN 加速', connected: false },
                    { name: 'GitHub Pages', desc: '将静态站点绑定到该域名', connected: false },
                    { name: 'Google Workspace', desc: '配置企业邮箱与协作套件', connected: false },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center gap-3 p-3.5 rounded-xl border border-border">
                      <div className="w-9 h-9 rounded-lg bg-muted grid place-items-center text-muted-foreground shrink-0">
                        <Plug className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.desc}</div>
                      </div>
                      <Button size="sm" variant={c.connected ? 'outline' : 'default'} onClick={() => toast(`即将开放：${c.name} 连接`)}>
                        {c.connected ? '已连接' : '连接'}
                      </Button>
                    </div>
                  ))}
                  <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    更多集成即将上线
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Small helpers ───────────────────────────────────────────────
const StatTile = ({ icon: Icon, value, label }: { icon: any; value: number | string; label: string }) => (
  <div className="p-3 rounded-xl bg-muted/50 border border-border text-center">
    <Icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
    <div className="text-lg font-semibold tabular-nums">{value}</div>
    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
  </div>
);

const MetaList = ({ rows }: { rows: [string, React.ReactNode][] }) => (
  <div className="space-y-0 text-sm">
    {rows.map(([k, v], i) => (
      <div
        key={i}
        className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0"
      >
        <span className="text-muted-foreground">{k}</span>
        <span className="font-medium text-right">{v}</span>
      </div>
    ))}
  </div>
);

const Row = ({
  label,
  hint,
  control,
}: {
  label: string;
  hint?: string;
  control: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-border">
    <div className="min-w-0">
      <div className="text-sm font-medium">{label}</div>
      {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
    </div>
    {control}
  </div>
);
