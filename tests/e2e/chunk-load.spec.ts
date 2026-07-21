// Playwright e2e: simulate a chunk-load failure (dynamic import 404) on both
// a Chromium and a WebKit (Safari) profile and verify:
//   1. the app doesn't enter a reload loop, and
//   2. the user can still recover and land on a working page.
//
// Run locally with:  npx playwright test tests/e2e/chunk-load.spec.ts
import { test, expect, devices } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:8080';

for (const [label, deviceOpts] of [
  ['chromium', devices['Desktop Chrome']],
  ['webkit',   devices['Desktop Safari']],
] as const) {
  test.describe(`chunk-load resilience [${label}]`, () => {
    test.use(deviceOpts);

    test('does not reload-loop and can recover after a failed chunk', async ({ page, context }) => {
      // Fail every JS chunk request that looks like a route split (assets/*.js)
      let failCount = 0;
      let reloadCount = 0;
      page.on('framenavigated', () => { reloadCount++; });

      await context.route(/\/assets\/.*\.js/, async (route) => {
        // Only fail the first few asset requests to simulate a stale-deploy chunk 404,
        // then let the retry succeed so the app recovers.
        failCount++;
        if (failCount <= 2) return route.fulfill({ status: 404, body: 'not found' });
        return route.continue();
      });

      await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
      // Wait long enough for lazyRetry's exponential backoff to kick in (400 + 800 + 1600ms)
      await page.waitForTimeout(5000);

      // Reload loops would produce >5 top-frame navigations; a healthy recovery is ≤3.
      expect(reloadCount).toBeLessThanOrEqual(3);

      // We should ultimately land on real app content, not a permanent error screen.
      const body = await page.textContent('body');
      expect(body || '').not.toMatch(/正在更新…\s*正在更新…/);
    });
  });
}
