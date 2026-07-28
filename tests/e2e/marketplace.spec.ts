import { test, expect } from '@playwright/test';

// Smoke test covering the marketplace browse flow.
// Ensures list renders, search input responds, and a card click navigates to detail.
test('marketplace loads, searches and opens a domain detail', async ({ page }) => {
  await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });

  // Header should render
  await expect(page.locator('body')).toContainText(/域名|Marketplace/i);

  // Search input should be visible (input or search role)
  const search = page.getByTestId('input-search-marketplace');
  if (await search.count()) {
    await search.fill('ai');
    await page.waitForTimeout(400);
  }

  // Wait for at least one link into a domain detail route
  const detailLink = page.locator('a[href^="/domain/"]').first();
  await detailLink.waitFor({ state: 'visible', timeout: 15_000 });
  await detailLink.click();
  await expect(page).toHaveURL(/\/domain\//);
});

// Switching language must not reset search text, TLD chip or sort selection.
test('marketplace keeps filters and pagination state across language switch', async ({ page }) => {
  await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });

  const search = page.getByTestId('input-search-marketplace');
  await search.waitFor({ state: 'visible', timeout: 15_000 });
  await search.fill('shop');

  await page.getByTestId('filter-tld-.com').click();
  await page.getByTestId('sort-price_asc').click();
  await page.waitForTimeout(300);

  const countBefore = await page.getByTestId('text-domain-count').innerText();

  // Toggle language through the switcher in the navbar
  const switcher = page.locator('button:has(svg.lucide-globe)').first();
  await switcher.click();
  await page.getByRole('menuitem', { name: 'English' }).click();
  await page.waitForTimeout(600);

  // Filters survive the language change
  await expect(page.getByTestId('input-search-marketplace')).toHaveValue('shop');
  await expect(page.getByTestId('filter-tld-.com')).toHaveClass(/bg-foreground/);
  await expect(page.getByTestId('sort-price_asc')).toHaveClass(/bg-foreground/);

  const countAfter = await page.getByTestId('text-domain-count').innerText();
  expect(countAfter.replace(/\D/g, '')).toBe(countBefore.replace(/\D/g, ''));
});

// The primary CTAs on the detail page must be translated and clickable in both locales.
for (const [lang, menuItem, offerLabel, backLabel] of [
  ['zh', '中文', '提交报价', '返回'],
  ['en', 'English', 'Submit Offer', 'Back'],
] as const) {
  test(`domain detail offer + back buttons are visible in ${lang}`, async ({ page }) => {
    await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });

    const switcher = page.locator('button:has(svg.lucide-globe)').first();
    await switcher.click();
    await page.getByRole('menuitem', { name: menuItem }).click();
    await page.waitForTimeout(500);

    const detailLink = page.locator('a[href^="/domain/"]').first();
    await detailLink.waitFor({ state: 'visible', timeout: 15_000 });
    await detailLink.click();
    await expect(page).toHaveURL(/\/domain\//);

    await expect(page.getByRole('button', { name: backLabel }).first()).toBeVisible();

    const offerBtn = page.getByRole('button', { name: offerLabel }).first();
    await expect(offerBtn).toBeVisible();
    await expect(offerBtn).toBeEnabled();
  });
}
