import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calculator, TrendingUp, Star, Info, Target, BarChart3, Briefcase,
  LineChart, Award, Zap, Search, CheckCircle, Copy, Globe, Sparkles,
  RefreshCw, Clock, History
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet } from '@/lib/apiClient';

/* ─────────────────────────── TYPES ─────────────────────────── */
interface EnhancedEvaluation {
  domain: string;
  estimatedValue: number;
  valueRange: { min: number; max: number };
  overallScore: number;
  detectedFeatures: string[];
  dimensions: {
    marketTrend: { score: number; analysis: string };
    industryApplication: { score: number; analysis: string };
    investmentValue: { score: number; analysis: string };
    brandPotential: { score: number; analysis: string };
    technicalQuality: { score: number; analysis: string };
    seoValue: { score: number; analysis: string };
  };
  overallAnalysis: string;
  recommendations: string[];
  confidence: number;
}

interface HistoryItem {
  domain: string;
  estimatedValue: number;
  overallScore: number;
  ts: number;
}

interface PlatformDomain {
  id: string;
  name: string;
  price: number;
  is_verified?: boolean;
  category?: string;
}

/* ─────────────────────────── CONSTANTS ─────────────────────────── */
const EXAMPLES = ['ai.com', 'tech.io', 'shop.cn', 'cloud.ai', 'data.net', 'smart.app'];
const HISTORY_KEY = 'nic_valuation_history';
const MAX_HISTORY = 5;

const TLD_SCORE: Record<string, number> = {
  com: 100, cn: 82, net: 52, org: 45, io: 72, ai: 88, app: 62, co: 50,
  xyz: 18, club: 22, top: 22, wang: 28, site: 20, online: 18, store: 30,
  shop: 35, tech: 40, dev: 55, me: 35, cc: 38, tv: 40, info: 25, biz: 22,
};

const TLD_MULTI: Record<string, number> = {
  com: 1.0, cn: 0.82, net: 0.5, org: 0.42, io: 0.72, ai: 0.9, app: 0.62,
  co: 0.5, xyz: 0.12, club: 0.18, top: 0.18, wang: 0.22, site: 0.15,
  online: 0.14, store: 0.28, shop: 0.32, tech: 0.38, dev: 0.48, me: 0.32,
  cc: 0.35, tv: 0.38, info: 0.2, biz: 0.18,
};

const HOT_KW = [
  'ai','gpt','llm','tech','cloud','pay','shop','mall','bank','health','edu',
  'learn','game','meta','web3','chain','smart','data','api','saas','code',
  'yun','shu','ke','xue','qian','bao','dian','jing','tao','pin','xin',
  'car','home','food','travel','news','photo','video','music','art','buy',
  'sell','job','chat','team','hub','lab','run','go','map','fast','safe',
];

const LOAD_STEPS = [
  { label: '解析域名结构', icon: Globe },
  { label: '多维度评分计算', icon: BarChart3 },
  { label: '生成评估报告', icon: Sparkles },
];

/* ─────────────────────────── SCORE HELPERS ─────────────────────────── */
function lenScore(n: number): number {
  const t: [number, number][] = [[1,99],[2,96],[3,91],[4,83],[5,73],[6,63],[7,54],[8,46],[10,37],[15,26]];
  for (const [max, s] of t) if (n <= max) return s;
  return 15;
}

function compScore(name: string): number {
  if (/^[a-z]+$/.test(name)) return 90;
  if (/^\d+$/.test(name)) return 75;
  if (/^[a-z\d]+$/.test(name)) return 60;
  if (name.includes('-')) return 35;
  return 50;
}

function brandScore(name: string): number {
  let s = 50;
  const l = name.length;
  s += l <= 4 ? 30 : l <= 6 ? 20 : l <= 8 ? 10 : -10;
  if (/^[a-z]+$/.test(name)) s += 15;
  if (name.includes('-')) s -= 20;
  if (/\d/.test(name)) s -= 5;
  const vowels = (name.match(/[aeiou]/g) || []).length / name.length;
  if (vowels > 0.2 && vowels < 0.6) s += 10;
  return Math.max(10, Math.min(98, s));
}

function detectKw(name: string): string[] {
  const lower = name.toLowerCase();
  return HOT_KW.filter(k => k.length >= 2 && lower.includes(k)).slice(0, 3);
}

function kwScore(name: string, kws: string[]): number {
  if (!kws.length) return 30;
  const cov = kws.reduce((s, k) => s + k.length, 0) / name.length;
  return Math.min(95, Math.round(50 + kws.length * 10 + cov * 20));
}

function basePrice(overall: number, tld: string): number {
  const m = TLD_MULTI[tld] ?? 0.12;
  const base =
    overall >= 92 ? 500000 :
    overall >= 85 ? 150000 :
    overall >= 78 ? 60000 :
    overall >= 70 ? 25000 :
    overall >= 62 ? 10000 :
    overall >= 54 ? 4000 :
    overall >= 45 ? 1500 : 600;
  return Math.round(base * m);
}

function detectFeatures(name: string, tld: string, kws: string[]): string[] {
  const f: string[] = [`.${tld.toUpperCase()}`];
  if (/^[a-z]+$/.test(name)) f.push(`纯字母 ${name.length}L`);
  else if (/^\d+$/.test(name)) {
    f.push(`纯数字 ${name.length}N`);
    if (['8','6','88','168','666','888','8888','6666','999'].includes(name)) f.push('吉祥数字');
  } else if (/^[a-z\d]+$/.test(name)) f.push('字母数字');
  if (name.includes('-')) f.push('含连字符');
  if (name.length <= 3) f.push('超短域名');
  else if (name.length <= 5) f.push('短域名');
  kws.forEach(k => f.push(`热词:${k}`));
  return f;
}

/* ─────────────────────────── TEXT GENERATORS ─────────────────────────── */
function txtMarket(name: string, tld: string, score: number): string {
  const kws = detectKw(name);
  if (kws.some(k => ['ai','gpt','llm'].includes(k)) || tld === 'ai')
    return 'AI 赛道正处于全球爆发期，相关域名稀缺性持续上升，过去两年平均成交价格涨幅超 150%，市场热度居高不下。';
  if (tld === 'io' || tld === 'dev')
    return '科技开发者群体高度青睐 .io/.dev 域名，创业公司和 SaaS 产品尤为集中，市场需求稳定且具备上升趋势。';
  if (tld === 'com' && name.length <= 5)
    return '.com 短域名长期处于供不应求状态，全球注册量趋于饱和，优质短域二级市场价格逐年走高，流动性良好。';
  if (tld === 'cn')
    return '国内 .cn 域名市场随数字中国战略推进持续升温，政府机构及国内品牌偏好度明显提升，具备稳健的市场基础。';
  if (score >= 70) return '该域名所在细分市场需求保持稳定增长，市场参与者活跃，预计未来 1~2 年仍有一定升值空间。';
  return '目前市场整体行情平稳，该域名具备基本的流通价值，适合中长期持有等待合适买家。';
}

function txtIndustry(name: string, kws: string[]): string {
  const tech = kws.filter(k => ['ai','gpt','tech','cloud','data','api','saas','code','dev','lab'].includes(k));
  const biz = kws.filter(k => ['pay','shop','mall','buy','sell','bank','store'].includes(k));
  const edu = kws.filter(k => ['edu','learn','xue','ke'].includes(k));
  if (tech.length) return `与科技、互联网、SaaS 等行业高度契合，关键词"${tech[0]}"在 IT 领域搜索量大，适合作为技术产品主站或工具类应用域名。`;
  if (biz.length) return `契合电商、零售、支付等消费互联网行业，关键词"${biz[0]}"具备清晰的商业指向性，适合消费品牌及平台类产品。`;
  if (edu.length) return '非常适合教育科技领域，在线教育、学习平台及职业技能类产品均可使用，行业需求量大。';
  if (name.length <= 4) return '短域名通用性极强，金融、医疗、教育、科技等主流行业均可适配，横向应用价值高。';
  return '该域名具有一定的通用性，可适配多个行业方向。建议结合目标行业品牌策略进行定向推广，提高成交效率。';
}

function txtInvestment(len: number, tld: string, score: number): string {
  const m = TLD_MULTI[tld] ?? 0.12;
  if (len <= 3 && m >= 0.7) return '三字母及以下优质短域名极度稀缺，历史证明此类资产抗通胀能力强，流动性好，投资回报率可观，适合长期持有。';
  if (len <= 5 && (tld === 'com' || tld === 'cn' || tld === 'ai')) return '短域名在主流后缀下具有较强保值属性，市场接受度高，可视为中高流动性数字资产，适合中期持有。';
  if (score >= 70) return '综合评分良好，具备一定投资价值。建议参考近期同类域名成交价制定合理挂牌策略，有望获得稳定回报。';
  return '该域名当前以实用价值为主，投资增值空间相对有限。若有对应行业精准买家，仍可实现较好成交价格。';
}

function txtBrand(name: string, score: number): string {
  const pure = /^[a-z]+$/.test(name);
  const short = name.length <= 5;
  if (pure && short) return '全字母短域名，朗朗上口，符合现代品牌命名简洁原则，可直接注册商标，品牌化路径清晰，适合打造独立品牌。';
  if (detectKw(name).length && name.length <= 8) return '包含品牌热词且长度适中，品牌辨识度较高，适合在对应行业内快速建立用户认知。';
  if (pure) return '纯字母组成，无特殊符号干扰，品牌适配度良好。可通过视觉设计和标志来强化品牌记忆度。';
  if (name.includes('-')) return '含连字符在品牌化方面存在一定障碍，用户容易输入遗漏，建议配合无连字符版本一同持有。';
  return '域名具备基本品牌化条件，结合良好视觉设计和内容运营，可在细分领域建立一定品牌认知。';
}

function txtTech(name: string): string {
  const l = name.length;
  if (l <= 3) return `仅 ${l} 个字符，极短易记，输入错误率接近零，邮件地址和网站访问都极为便捷，技术适用性出色。`;
  if (l <= 5 && /^[a-z]+$/.test(name)) return `${l} 字符纯字母，输入便捷，任何输入法下均不易出错，适合作为主域名长期使用。`;
  if (name.includes('-')) return '含有连字符，用户直接输入时存在门槛，对邮件地址可读性也有影响，技术友好度略低。';
  if (l <= 8) return `${l} 字符属中等范围，输入便利，兼容性好，适合作为主域名或子域名使用。`;
  return `域名较长（${l} 字符），建议配合短链跳转或品牌缩写使用，以降低用户直接输入的门槛。`;
}

function txtSEO(name: string, kws: string[]): string {
  if (kws.length >= 2) return `包含多个热门关键词（${kws.slice(0,2).join('、')}），在搜索引擎中具有天然匹配优势，可显著降低 SEO 建设成本。`;
  if (kws.length === 1) return `含有搜索热词"${kws[0]}"，有助于搜索引擎精准抓取，在相关行业关键词竞争中具备一定自然流量优势。`;
  if (name.length <= 4) return '短域名在品牌搜索层面具有天然优势，用户搜索品牌名时直接命中概率更高，长期有助于提升有机流量。';
  return '该域名 SEO 价值属中等水平，建议通过高质量内容运营提升自然排名，域名本身不会构成明显 SEO 障碍。';
}

function txtOverall(domain: string, score: number, name: string, tld: string, kws: string[]): string {
  const tu = tld.toUpperCase();
  const pure = /^[a-z]+$/.test(name);
  if (score >= 85)
    return `${domain} 是综合素质优秀的域名资产。.${tu} 后缀权威性强，${name.length} 字符的主体长度具备稀缺性，${pure ? '纯字母组成可读性极佳，' : ''}${kws.length ? `包含热门关键词"${kws[0]}"更是加分项，` : ''}二级市场流动性良好，适合作为旗舰品牌域名或优质数字资产持有。`;
  if (score >= 72)
    return `${domain} 是质量较好的域名，各项指标均衡。.${tu} 后缀在市场上有一定认可度，${kws.length ? `域名包含"${kws[0]}"等相关词，具备一定行业定向价值，` : `主体"${name}"简洁度适中，`}适合有明确用途需求的买家或中期投资持有。`;
  if (score >= 55)
    return `${domain} 属中等质量域名，具备基本流通价值。建议定位精准的目标买家群体，针对性推广可提升成交效率。如作为投资持有，需要较长的等待周期。`;
  return `${domain} 当前市场价值相对有限，建议将其定位为实用型域名，针对有具体业务需求的买家进行推广。若存在明显短板，可考虑作为组合域名策略的一部分。`;
}

function genRecs(domain: string, score: number, name: string, tld: string, kws: string[]): string[] {
  const r: string[] = [];
  const m = TLD_MULTI[tld] ?? 0.12;
  if (score >= 80) r.push('综合评分优秀，建议以市场估值上限定价，同时开放报价接受诚意买家洽谈。');
  else if (score >= 65) r.push('评分良好，建议以合理区间中间价挂牌，配合优质域名描述提升曝光转化。');
  else r.push('当前评分中等，建议以接近估值区间下限的价格挂牌，提高成交概率。');
  if (tld === 'com' && name.length <= 6) r.push('优质 .com 短域名可同时在多个平台挂售，扩大曝光面，缩短成交周期。');
  if (kws.length) r.push(`域名包含关键词"${kws[0]}"，建议在描述中重点标注相关行业应用场景，吸引精准买家。`);
  if (name.includes('-')) r.push('如有条件，建议同时持有去掉连字符的版本，可作组合资产一并出售，提升整体价值。');
  if (m < 0.3 && name.length <= 8) r.push(`可考虑同步注册 .com 或 .cn 版本同名域名，作配套资产，有助于组合定价提升整体估值。`);
  if (!r.some(x => x.includes('历史'))) r.push('在挂牌页面添加域名历史数据（备案信息、Whois 年限等），增加买家信任度，缩短成交周期。');
  return r.slice(0, 4);
}

/* ─────────────────────────── LOCAL EVALUATE ─────────────────────────── */
function localEvaluate(domain: string): EnhancedEvaluation {
  const clean = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const parts = clean.split('.');
  const tld = parts[parts.length - 1];
  const name = parts[0];

  const ls = lenScore(name.length);
  const ts = TLD_SCORE[tld] ?? 15;
  const cs = compScore(name);
  const bs = brandScore(name);
  const kws = detectKw(name);
  const ks = kwScore(name, kws);

  const dimMarket    = Math.min(98, Math.round(ts * 0.45 + ks * 0.4 + ls * 0.15));
  const dimIndustry  = Math.min(98, Math.round(ks * 0.65 + cs * 0.2 + ls * 0.15));
  const dimInvest    = Math.min(98, Math.round(ls * 0.4 + ts * 0.35 + cs * 0.25));
  const dimBrand     = Math.min(98, Math.round(bs * 0.55 + ls * 0.3 + cs * 0.15));
  const dimTech      = Math.min(98, Math.round(ls * 0.55 + cs * 0.45));
  const dimSEO       = Math.min(98, Math.round(ks * 0.6 + ls * 0.4));

  const overall = Math.round((dimMarket + dimIndustry + dimInvest + dimBrand + dimTech + dimSEO) / 6);

  const bp = basePrice(overall, tld);
  const vari = overall >= 75 ? 0.4 : 0.5;

  return {
    domain: clean,
    estimatedValue: bp,
    valueRange: { min: Math.round(bp * (1 - vari * 0.5)), max: Math.round(bp * (1 + vari)) },
    overallScore: overall,
    detectedFeatures: detectFeatures(name, tld, kws),
    dimensions: {
      marketTrend:        { score: dimMarket,   analysis: txtMarket(name, tld, dimMarket) },
      industryApplication:{ score: dimIndustry, analysis: txtIndustry(name, kws) },
      investmentValue:    { score: dimInvest,   analysis: txtInvestment(name.length, tld, dimInvest) },
      brandPotential:     { score: dimBrand,    analysis: txtBrand(name, dimBrand) },
      technicalQuality:   { score: dimTech,     analysis: txtTech(name) },
      seoValue:           { score: dimSEO,      analysis: txtSEO(name, kws) },
    },
    overallAnalysis: txtOverall(clean, overall, name, tld, kws),
    recommendations: genRecs(clean, overall, name, tld, kws),
    confidence: Math.min(90, 55 + (TLD_SCORE[tld] ? 15 : 0) + (/^[a-z]+$/.test(name) ? 10 : 0) + (name.length <= 6 ? 10 : 0)),
  };
}

/* ─────────────────────────── SCORE RING ─────────────────────────── */
const ScoreRing = ({ score }: { score: number }) => {
  const r = 44, cx = 56, cy = 56, sw = 10;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 65 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? '优秀' : score >= 65 ? '良好' : score >= 50 ? '一般' : '待提升';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 112, height: 112 }}>
      <svg width={112} height={112} className="absolute inset-0 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw} stroke="currentColor" className="text-muted/20" />
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw}
          stroke={color} strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-2xl font-black tabular-nums" style={{ color }}>{score}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
};

/* ─────────────────────────── SCORE COLOR ─────────────────────────── */
const sc = (s: number) =>
  s >= 80 ? 'text-green-600 bg-green-500/10 border-green-500/30' :
  s >= 65 ? 'text-blue-600 bg-blue-500/10 border-blue-500/30' :
  s >= 50 ? 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30' :
            'text-red-600 bg-red-500/10 border-red-500/30';

const scLabel = (s: number) => s >= 80 ? '优秀' : s >= 65 ? '良好' : s >= 50 ? '一般' : '较弱';
const scBar   = (s: number) =>
  s >= 80 ? '[&>div]:bg-green-500' : s >= 65 ? '[&>div]:bg-blue-500' :
  s >= 50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500';

const DIM_CONFIG = {
  marketTrend:         { icon: TrendingUp, label: '市场趋势' },
  industryApplication: { icon: Briefcase,  label: '行业应用' },
  investmentValue:     { icon: LineChart,  label: '投资价值' },
  brandPotential:      { icon: Award,      label: '品牌潜力' },
  technicalQuality:    { icon: Zap,        label: '技术质量' },
  seoValue:            { icon: Search,     label: 'SEO 价值' },
};

interface DomainValuationToolProps { domainName?: string; }

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */
export const DomainValuationTool: React.FC<DomainValuationToolProps> = ({ domainName = '' }) => {
  const [input, setInput] = useState(domainName);
  const [result, setResult] = useState<EnhancedEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [platDomains, setPlatDomains] = useState<PlatformDomain[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')); } catch {}
  }, []);

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [result]);

  const saveHistory = useCallback((item: HistoryItem) => {
    setHistory(prev => {
      const next = [item, ...prev.filter(h => h.domain !== item.domain)].slice(0, MAX_HISTORY);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const fetchPlatformDomains = async () => {
    try {
      const data = await apiGet<PlatformDomain[]>('/data/domain-listings?status=available&limit=6');
      setPlatDomains(Array.isArray(data) ? data : []);
    } catch {}
  };

  const runEvaluation = async (domain: string) => {
    const d = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!d) { toast.error('请输入域名'); return; }
    if (!d.includes('.')) { toast.error('请输入完整域名，如 example.com'); return; }

    setLoading(true);
    setStep(0);
    setResult(null);

    const stepTimer = setInterval(() => setStep(s => Math.min(s + 1, 2)), 600);

    try {
      let evalResult: EnhancedEvaluation;

      try {
        const { data, error } = await supabase.functions.invoke('domain-enhanced-evaluation', { body: { domain: d } });
        if (error || !data) throw new Error('edge function unavailable');
        evalResult = { ...data, overallScore: data.overallScore ?? Math.round(Object.values(data.dimensions || {}).reduce((s: number, v: any) => s + (v.score || 0), 0) / 6), detectedFeatures: data.detectedFeatures ?? localEvaluate(d).detectedFeatures };
      } catch {
        await new Promise(r => setTimeout(r, 900));
        evalResult = localEvaluate(d);
      }

      setResult(evalResult);
      saveHistory({ domain: evalResult.domain, estimatedValue: evalResult.estimatedValue, overallScore: evalResult.overallScore, ts: Date.now() });
      fetchPlatformDomains();
      toast.success('评估完成！');
    } catch (e: any) {
      toast.error(e.message || '评估失败，请重试');
    } finally {
      clearInterval(stepTimer);
      setStep(3);
      setLoading(false);
    }
  };

  const handleEvaluate = () => runEvaluation(input);
  const handleExample = (ex: string) => { setInput(ex); runEvaluation(ex); };
  const handleHistory = (h: HistoryItem) => { setInput(h.domain); runEvaluation(h.domain); };

  const copyResult = () => {
    if (!result) return;
    const text = `域名估值报告 - ${result.domain}\n建议价格：¥${result.estimatedValue.toLocaleString()}\n价值区间：¥${result.valueRange.min.toLocaleString()} ~ ¥${result.valueRange.max.toLocaleString()}\n综合评分：${result.overallScore}/100\n\n${result.overallAnalysis}\n\n来源：nic.rw 域名估值工具`;
    navigator.clipboard.writeText(text).then(() => toast.success('已复制到剪贴板'));
  };

  return (
    <div className="space-y-5">
      {/* ── Input Card ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5 text-primary" />
            域名估值工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="输入任意域名，如：example.com"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEvaluate()}
              className="flex-1 text-base"
            />
            <Button onClick={handleEvaluate} disabled={loading} className="shrink-0 px-6">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : '开始估值'}
            </Button>
          </div>

          {/* Examples */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">快速体验（点击试试）：</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => handleExample(ex)}
                  disabled={loading}
                  className="text-xs px-3 py-1 rounded-full border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <History className="h-3 w-3" /> 最近记录：
              </p>
              <div className="flex flex-wrap gap-2">
                {history.map(h => (
                  <button
                    key={h.domain}
                    onClick={() => handleHistory(h)}
                    disabled={loading}
                    className="group flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    <Clock className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                    <span>{h.domain}</span>
                    <span className="text-muted-foreground">¥{h.estimatedValue >= 10000 ? (h.estimatedValue / 10000).toFixed(1) + 'w' : h.estimatedValue.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info row */}
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>估值结果由多维度算法生成，综合考量域名长度、后缀类型、关键词价值、市场行情等因素，<strong>仅供参考</strong>，不构成买卖建议。</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Loading ── */}
      {loading && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
              </div>
              <div className="space-y-2.5">
                {LOAD_STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const done = i < step;
                  const active = i === step;
                  return (
                    <div key={s.label} className={`flex items-center gap-2.5 text-sm transition-colors ${done ? 'text-green-500' : active ? 'text-primary font-medium' : 'text-muted-foreground/40'}`}>
                      {done
                        ? <CheckCircle className="h-4 w-4" />
                        : <Icon className={`h-4 w-4 ${active ? 'animate-pulse' : ''}`} />}
                      {s.label}
                      {active && <span className="text-xs text-muted-foreground animate-pulse">处理中...</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div ref={resultRef} className="space-y-4">
          {/* Score + Price */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex flex-col sm:flex-row gap-5 items-center">
                {/* Score ring */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <ScoreRing score={result.overallScore} />
                  <span className="text-xs text-muted-foreground">综合评分</span>
                </div>

                <div className="flex-1 space-y-3 w-full">
                  {/* Price row */}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">建议挂牌价</p>
                      <p className="text-3xl font-black text-primary">¥{result.estimatedValue.toLocaleString()}</p>
                    </div>
                    <div className="text-sm text-muted-foreground pb-0.5">
                      区间：<span className="text-foreground font-medium">¥{result.valueRange.min.toLocaleString()}</span> ~ <span className="text-foreground font-medium">¥{result.valueRange.max.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">置信度</span>
                    <Progress value={result.confidence} className="flex-1 h-2 max-w-[120px]" />
                    <span className="text-xs font-semibold text-primary">{result.confidence}%</span>
                  </div>

                  {/* Feature tags */}
                  {result.detectedFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.detectedFeatures.map(f => (
                        <Badge key={f} variant="secondary" className="text-[11px] px-2 py-0.5">{f}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Copy button */}
                <Button variant="ghost" size="sm" onClick={copyResult} className="shrink-0 self-start sm:self-center">
                  <Copy className="h-4 w-4 mr-1" /> 复制
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dimensions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" /> 六维评分
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.entries(result.dimensions) as [keyof typeof DIM_CONFIG, { score: number; analysis: string }][]).map(([key, dim]) => {
                  const { icon: Icon, label } = DIM_CONFIG[key];
                  return (
                    <div key={key} className="p-3.5 border rounded-xl hover:shadow-sm transition-shadow bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium text-sm">{label}</span>
                        </div>
                        <Badge className={`text-xs border ${sc(dim.score)}`}>
                          {dim.score} · {scLabel(dim.score)}
                        </Badge>
                      </div>
                      <Progress value={dim.score} className={`h-1.5 mb-2 ${scBar(dim.score)}`} />
                      <p className="text-xs text-muted-foreground leading-relaxed">{dim.analysis}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Overall analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4" /> 综合分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{result.overallAnalysis}</p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-4 w-4 text-green-500" /> 专业建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-foreground leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Platform similar domains */}
          {platDomains.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4" /> 平台在售域名参考
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {platDomains.slice(0, 6).map(d => (
                    <a
                      key={d.id}
                      href={`/domain/${d.name}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate group-hover:text-primary">{d.name}</span>
                        {d.is_verified && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">已验证</Badge>}
                      </div>
                      <span className="text-sm font-bold text-foreground ml-2 shrink-0">¥{Number(d.price).toLocaleString()}</span>
                    </a>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  以上为平台当前在售域名，仅供价格参考，实际成交价以买卖双方协商为准。
                </p>
              </CardContent>
            </Card>
          )}

          {/* Re-evaluate */}
          <div className="flex justify-center pt-1">
            <Button variant="outline" onClick={() => { setResult(null); setInput(''); }} className="gap-2">
              <RefreshCw className="h-4 w-4" /> 评估另一个域名
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
