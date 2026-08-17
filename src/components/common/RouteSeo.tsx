import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getCanonicalUrl, getHreflangAlternates } from '@/lib/canonicalUrl';

interface SeoEntry {
  title: string;
  description: string;
  noindex?: boolean;
}

const SITE_NAME = '域见•你';
const DEFAULT: SeoEntry = {
  title: '域见•你 — 精品域名交易平台｜安全托管·AI估值·域名拍卖',
  description: '域见•你 精品域名交易平台：海量优质域名一站选购，支持安全托管交易、AI 智能估值、域名拍卖与过户保障。',
};

/** 精确路径 → 元信息 */
const EXACT: Record<string, SeoEntry> = {
 '/': DEFAULT,
 '/marketplace': {
    title: '域名市场 — 精品域名在售列表｜域见•你',
    description: '浏览域见•你精品域名市场：按价格、长度、后缀筛选优质域名，支持收藏、议价与安全托管交易。',
  },
 '/auctions': {
    title: '域名拍卖 — 竞价抢购优质域名｜域见•你',
    description: '参与域见•你域名拍卖：实时竞价、自动出价与保留价机制，公平透明地竞得心仪域名。',
  },
 '/valuation': {
    title: 'AI 域名估值 — 免费评估域名价值｜域见•你',
    description: '使用 AI 多维度模型免费评估域名价值：长度、后缀、关键词热度与市场成交对比，秒出估价报告。',
  },
 '/sell': {
    title: '出售域名 — 免费上架与议价托管｜域见•你',
    description: '在域见•你免费上架出售域名：一口价或议价模式，平台托管收款与过户，交易安全省心。',
  },
 '/escrow': {
    title: '担保交易 — 域名资金与过户托管｜域见•你',
    description: '域见•你担保交易服务：买家付款进入托管，卖家完成过户后放款，全流程可追踪，双方零风险。',
  },
 '/seller': {
    title: '卖家中心 — 域名出售与结算服务｜域见•你',
    description: '卖家中心：批量上架、报价管理、收益结算与实名认证，帮助域名投资者高效变现。',
  },
 '/platform-services': {
    title: '平台服务 — 交易·估值·监控一站式｜域见•你',
    description: '域见•你平台服务总览：域名交易、AI 估值、到期监控、DNS 管理与担保过户等一站式能力。',
  },
 '/domain-monitor': {
    title: '域名监控 — 到期与状态实时提醒｜域见•你',
    description: '添加域名监控，自动检测解析状态与到期时间变化，第一时间通过站内信与邮件提醒。',
  },
 '/community': {
    title: '域名社区 — 行业动态与交流｜域见•你',
    description: '域见•你社区：域名投资经验、行业动态与成交案例分享，与同好交流米市趋势。',
  },
 '/help': {
    title: '帮助中心 — 使用指南与常见问题｜域见•你',
    description: '域见•你帮助中心：账号、交易、过户、支付与提现的完整操作指南。',
  },
 '/faq': {
    title: '常见问题 FAQ — 交易与过户答疑｜域见•你',
    description: '关于域名购买、报价、担保交易、过户与退款的常见问题解答。',
  },
 '/contact': {
    title: '联系我们 — 客服与商务合作｜域见•你',
    description: '联系域见•你团队：客户支持、商务合作与批量域名采购咨询渠道。',
  },
 '/terms': {
    title: '服务条款｜域见•你',
    description: '域见•你平台服务条款：用户权利义务、交易规则与责任说明。',
  },
 '/privacy': {
    title: '隐私政策｜域见•你',
    description: '域见•你隐私政策：说明我们如何收集、使用与保护您的个人信息。',
  },
 '/disclaimer': {
    title: '免责声明｜域见•你',
    description: '域见•你免责声明：平台信息展示与第三方内容的责任边界说明。',
  },
 '/security-center': {
    title: '安全中心 — 账号保护与两步验证｜域见•你',
    description: '安全中心：开启两步验证、管理登录设备与恢复码，全面保护您的域名资产。',
  },
 '/tools/portfolio-valuation': {
    title: '域名组合估值 — 批量资产评估报告｜域见•你',
    description: '批量导入域名生成组合估值报告，掌握资产总值分布与优化建议。',
  },
 '/auth': {
    title: '登录 / 注册｜域见•你',
    description: '登录或注册域见•你账号，管理您的域名、报价与交易订单。',
    noindex: true,
  },
};

/** 前缀匹配（私密/交易类页面统一 noindex） */
const PREFIX: Array<[string, SeoEntry]> = [
  ['/admin', { title: '管理后台｜域见•你', description: '平台管理后台。', noindex: true }],
  ['/dashboard', { title: '控制台｜域见•你', description: '用户控制台。', noindex: true }],
  ['/user-center', { title: '用户中心｜域见•你', description: '用户中心。', noindex: true }],
  ['/checkout', { title: '订单结算｜域见•你', description: '订单结算页面。', noindex: true }],
  ['/order', { title: '订单详情｜域见•你', description: '订单详情页面。', noindex: true }],
  ['/transaction', { title: '交易详情｜域见•你', description: '交易详情页面。', noindex: true }],
  ['/my-offers', { title: '我的报价｜域见•你', description: '我的报价记录。', noindex: true }],
  ['/favorites', { title: '我的收藏｜域见•你', description: '收藏的域名。', noindex: true }],
  ['/portfolio', { title: '我的资产｜域见•你', description: '域名资产组合。', noindex: true }],
  ['/domain-management', { title: '域名管理｜域见•你', description: '管理我的域名。', noindex: true }],
  ['/dns', { title: 'DNS 管理｜域见•你', description: 'DNS 解析记录管理。', noindex: true }],
  ['/notifications', { title: '通知中心｜域见•你', description: '站内通知。', noindex: true }],
  ['/profile', { title: '个人资料｜域见•你', description: '用户资料页面。', noindex: true }],
  ['/reset-password', { title: '重置密码｜域见•你', description: '重置账号密码。', noindex: true }],
  ['/domain-verification', { title: '域名验证｜域见•你', description: '域名所有权验证。', noindex: true }],
  ['/dispute', { title: '纠纷中心｜域见•你', description: '交易纠纷处理。', noindex: true }],
  ['/bulk-listing', { title: '批量上架｜域见•你', description: '批量上架域名。', noindex: true }],
  ['/seller/earnings', { title: '卖家收益｜域见•你', description: '卖家结算与提现。', noindex: true }],
  ['/maintenance', { title: '系统维护中｜域见•你', description: '平台维护中，请稍后访问。', noindex: true }],
];

function resolve(pathname: string): SeoEntry | null {
  // 域名详情页自行管理动态元信息，这里不覆盖
  if (pathname.startsWith('/domain/') || pathname.startsWith('/domains/')) return null;
  if (EXACT[pathname]) return EXACT[pathname];
  const hit = PREFIX.find(([p]) => pathname === p || pathname.startsWith(p + '/'));
  if (hit) return hit[1];
  return DEFAULT;
}

/**
 * 按路由注入唯一的 title / description / canonical / OG 标签。
 * 避免全站所有页面共用 index.html 里的同一份元信息（SEO 重复内容问题）。
 */
export const RouteSeo = () => {
  const { pathname } = useLocation();
  const entry = resolve(pathname);
  if (!entry) return null;

  const url = getCanonicalUrl(pathname);
  const alternates = getHreflangAlternates(pathname);

  return (
    <Helmet prioritizeSeoTags>
      <title>{entry.title}</title>
      <meta name="description" content={entry.description} />
      <link rel="canonical" href={url} />
      {entry.noindex
        ? <meta name="robots" content="noindex, nofollow" />
        : <meta name="robots" content="index, follow, max-image-preview:large" />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={entry.title} />
      <meta property="og:description" content={entry.description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={entry.title} />
      <meta name="twitter:description" content={entry.description} />
      {!entry.noindex && alternates.map(a => (
        <link key={a.hrefLang} rel="alternate" hrefLang={a.hrefLang} href={a.href} />
      ))}
    </Helmet>
  );
};
