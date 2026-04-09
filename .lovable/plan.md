

## Problem

The currency converter uses the **Frankfurter API**, which is based on ECB data and **does not support CNY** (Chinese Yuan). Since most domain prices are in CNY or need CNY conversion, the API returns an error, causing "汇率获取失败" on every domain detail page.

## Solution

Replace the Frankfurter API with a **hardcoded fallback exchange rate table** combined with an alternative free API that supports CNY. The approach:

1. **Add fallback rates** — Embed a static rate table (USD/CNY ≈ 7.25, EUR/CNY, etc.) so conversion always works even if the API is down.

2. **Switch API to ExchangeRate-API or use a proxy** — Use `https://open.er-api.com/v6/latest/{base}` which is free, no-key, and supports CNY. If the API call fails, fall back to the hardcoded rates.

3. **Cache rates in sessionStorage** — Cache successful API responses for 1 hour to reduce API calls and improve reliability.

### Technical Details

**File: `src/components/domain/CurrencyConverter.tsx`**

- Replace `FRANKFURTER_BASE` with `https://open.er-api.com/v6/latest`
- Add a `FALLBACK_RATES` object with approximate CNY-based rates
- Parse the new API response format: `data.rates[targetCurrency]`
- Add sessionStorage caching with 1-hour TTL
- On fetch failure, use fallback rates and show a subtle indicator ("参考汇率")

