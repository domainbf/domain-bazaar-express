import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CurrencyConverterProps {
  priceAmount: number;
  priceCurrency: string;
}

const CURRENCIES = [
  { code: "CNY", symbol: "¥", name: "人民币" },
  { code: "USD", symbol: "$", name: "美元" },
  { code: "EUR", symbol: "€", name: "欧元" },
  { code: "GBP", symbol: "£", name: "英镑" },
  { code: "JPY", symbol: "¥", name: "日元" },
  { code: "HKD", symbol: "HK$", name: "港币" },
  { code: "SGD", symbol: "S$", name: "新加坡元" },
  { code: "AUD", symbol: "A$", name: "澳元" },
  { code: "CAD", symbol: "C$", name: "加元" },
  { code: "KRW", symbol: "₩", name: "韩元" },
  { code: "TWD", symbol: "NT$", name: "台币" },
  { code: "THB", symbol: "฿", name: "泰铢" },
];

// Fallback rates relative to CNY (1 CNY = X target)
const FALLBACK_RATES_FROM_CNY: Record<string, number> = {
  CNY: 1,
  USD: 0.1379,
  EUR: 0.1267,
  GBP: 0.1089,
  JPY: 20.83,
  HKD: 1.078,
  SGD: 0.1862,
  AUD: 0.2137,
  CAD: 0.1923,
  KRW: 189.5,
  TWD: 4.46,
  THB: 4.82,
};

const CACHE_KEY = "currency_rates_cache";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCachedRates(base: string): Record<string, number> | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_KEY}_${base}`);
    if (!raw) return null;
    const { rates, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return rates;
  } catch { /* ignore */ }
  return null;
}

function setCachedRates(base: string, rates: Record<string, number>) {
  try {
    sessionStorage.setItem(`${CACHE_KEY}_${base}`, JSON.stringify({ rates, ts: Date.now() }));
  } catch { /* ignore */ }
}

function getFallbackRate(from: string, to: string): number {
  if (from === to) return 1;
  const fromCny = FALLBACK_RATES_FROM_CNY[from];
  const toCny = FALLBACK_RATES_FROM_CNY[to];
  if (!fromCny || !toCny) return 1;
  // Convert: amount in `from` -> CNY -> `to`
  // 1 from = (1/fromCny) CNY, then * toCny
  return toCny / fromCny;
}

function formatAmount(amount: number, code: string): string {
  if (code === "JPY" || code === "KRW") {
    return Math.round(amount).toLocaleString();
  }
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CurrencyConverter({ priceAmount, priceCurrency }: CurrencyConverterProps) {
  const baseCurrency = (priceCurrency || "CNY").toUpperCase();
  const defaultTarget = baseCurrency === "CNY" ? "USD" : "CNY";

  const [targetCurrency, setTargetCurrency] = useState(defaultTarget);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const fetchRate = useCallback(async (from: string, to: string) => {
    if (from === to) { setRate(1); setIsFallback(false); setLoading(false); return; }

    // Check cache first
    const cached = getCachedRates(from);
    if (cached && cached[to] != null) {
      setRate(cached[to]);
      setIsFallback(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      if (data.result !== "success" || !data.rates) throw new Error("bad response");
      setCachedRates(from, data.rates);
      setRate(data.rates[to] ?? getFallbackRate(from, to));
      setIsFallback(!data.rates[to]);
    } catch {
      const fb = getFallbackRate(from, to);
      setRate(fb);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate(baseCurrency, targetCurrency);
  }, [baseCurrency, targetCurrency, fetchRate]);

  const convertedAmount = rate != null ? priceAmount * rate : null;
  const targetInfo = CURRENCIES.find(c => c.code === targetCurrency);
  const baseInfo = CURRENCIES.find(c => c.code === baseCurrency);
  const availableTargets = CURRENCIES.filter(c => c.code !== baseCurrency);

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
          <span className="shrink-0">货币换算</span>
          <span className="shrink-0 font-medium text-foreground">
            {baseInfo?.symbol}{priceAmount.toLocaleString()} {baseCurrency}
          </span>
          <span className="shrink-0">≈</span>

          {loading && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              加载中...
            </span>
          )}
          {!loading && convertedAmount != null && (
            <span className="font-bold text-foreground text-base">
              {targetInfo?.symbol}{formatAmount(convertedAmount, targetCurrency)}
              {isFallback && <span className="ml-1 text-xs font-normal text-muted-foreground">(参考汇率)</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                {targetCurrency}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
              {availableTargets.map(c => (
                <DropdownMenuItem
                  key={c.code}
                  onSelect={() => setTargetCurrency(c.code)}
                  className={`text-sm gap-2 ${targetCurrency === c.code ? "font-bold" : ""}`}
                >
                  <span className="w-8 shrink-0 font-mono">{c.code}</span>
                  <span className="text-muted-foreground">{c.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              try { sessionStorage.removeItem(`${CACHE_KEY}_${baseCurrency}`); } catch {}
              fetchRate(baseCurrency, targetCurrency);
            }}
            disabled={loading}
            title="刷新汇率"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
