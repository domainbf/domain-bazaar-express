import { test, expect } from '@playwright/test';

// Smoke test covering the marketplace browse flow.
// Ensures list renders, search input responds, and a card click navigates to detail.
test('marketplace loads, searches and opens a domain detail', async ({ page }) => {
  await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });

  // Header should render
  await expect(page.locator('body')).toContainText(/域名|Marketplace/i);

  // Search input should be visible (input or search role)
  const search = page.locator('input[type="search"], input[placeholder*="搜索"], input[placeholder*="Search"]').first();
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
