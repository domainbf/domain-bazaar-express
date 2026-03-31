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

const FRANKFURTER_BASE = "https://api.frankfurter.app";

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
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchRate = useCallback(async (from: string, to: string) => {
    if (from === to) {
      setRate(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${FRANKFURTER_BASE}/latest?from=${from}&to=${to}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setRate(data.rates[to] ?? null);
      setLastUpdated(data.date ?? null);
    } catch {
      setError(true);
      setRate(null);
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
          {!loading && error && (
            <span className="text-destructive text-xs">汇率获取失败</span>
          )}
          {!loading && !error && convertedAmount != null && (
            <span className="font-bold text-foreground text-base">
              {targetInfo?.symbol}{formatAmount(convertedAmount, targetCurrency)}
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
            onClick={() => fetchRate(baseCurrency, targetCurrency)}
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
