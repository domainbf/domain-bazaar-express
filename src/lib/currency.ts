// 全站统一币种符号、格式化、单位换算
export const CURRENCY_SYMBOL: Record<string, string> = {
  CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥', HKD: 'HK$',
  SGD: 'S$', AUD: 'A$', CAD: 'C$', KRW: '₩', TWD: 'NT$', THB: '฿',
};

export const CURRENCIES = [
  { code: 'CNY', symbol: '¥', name: '人民币' },
  { code: 'USD', symbol: '$', name: '美元' },
  { code: 'EUR', symbol: '€', name: '欧元' },
  { code: 'GBP', symbol: '£', name: '英镑' },
  { code: 'JPY', symbol: '¥', name: '日元' },
  { code: 'HKD', symbol: 'HK$', name: '港币' },
  { code: 'SGD', symbol: 'S$', name: '新加坡元' },
  { code: 'AUD', symbol: 'A$', name: '澳元' },
  { code: 'CAD', symbol: 'C$', name: '加元' },
  { code: 'KRW', symbol: '₩', name: '韩元' },
  { code: 'TWD', symbol: 'NT$', name: '台币' },
  { code: 'THB', symbol: '฿', name: '泰铢' },
];

export function getCurrencySymbol(currency?: string | null) {
  return CURRENCY_SYMBOL[(currency || 'CNY').toUpperCase()] || '';
}

/** 标准格式 — 千位分隔 e.g. ¥1,234,567 */
export function formatPrice(price: number | null | undefined, currency?: string | null): string {
  if (price == null || isNaN(Number(price))) return '面议';
  const sym = getCurrencySymbol(currency);
  const n = Number(price);
  return `${sym}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/** 紧凑格式 — 万 / k 适用于卡片 */
export function formatPriceCompact(price: number | null | undefined, currency?: string | null): string {
  if (price == null || isNaN(Number(price))) return '面议';
  const sym = getCurrencySymbol(currency);
  const n = Number(price);
  const code = (currency || 'CNY').toUpperCase();
  if (code === 'CNY' && n >= 10000) {
    return `${sym}${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}万`;
  }
  if (n >= 1000) return `${sym}${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${sym}${n.toLocaleString()}`;
}

/** 近似汇率（相对 CNY），用于离线预览换算 */
export const FALLBACK_RATES_FROM_CNY: Record<string, number> = {
  CNY: 1, USD: 0.1379, EUR: 0.1267, GBP: 0.1089, JPY: 20.83,
  HKD: 1.078, SGD: 0.1862, AUD: 0.2137, CAD: 0.1923,
  KRW: 189.5, TWD: 4.46, THB: 4.82,
};

/** 将任意币种金额换算到目标币种（基于 CNY 中转，使用近似汇率） */
export function convertCurrency(amount: number, from: string, to: string): number {
  const f = (from || 'CNY').toUpperCase();
  const t = (to || 'CNY').toUpperCase();
  if (f === t) return amount;
  const fromRate = FALLBACK_RATES_FROM_CNY[f] ?? 1;
  const toRate = FALLBACK_RATES_FROM_CNY[t] ?? 1;
  // amount(from) -> CNY -> to
  const inCny = amount / fromRate;
  return inCny * toRate;
}
