import { test, expect } from '@playwright/test';

/**
 * 跨环境（Supabase 桥接 / 旧 /api/data）关键管理动作 E2E。
 * 验证：保存后重新读取页面能反映更改，或在无管理员权限时给出可读的失败原因。
 */

const gotoAdmin = async (page: any, tab: string) => {
  await page.goto(`/admin?tab=${tab}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
};

test('后端诊断面板显示当前请求通道与最近请求摘要', async ({ page }) => {
  await gotoAdmin(page, 'diagnostics');

  const panel = page.getByTestId('admin-diagnostics');
  if (!(await panel.count())) {
    test.skip(true, '未以管理员身份登录，跳过');
  }

  await expect(page.getByTestId('badge-backend-mode')).toContainText(/Supabase|api\/data/);

  await page.getByTestId('button-probe-settings').click();
  await expect(page.getByTestId('last-request-summary')).toContainText('/data/site-settings', { timeout: 15_000 });
});

test('站点设置：保存后重新读取应反映更改，失败时给出可读原因', async ({ page }) => {
  await gotoAdmin(page, 'quick-settings');

  const saveBtn = page.getByTestId('button-save-quick-settings');
  if (!(await saveBtn.count())) {
    test.skip(true, '未以管理员身份登录，跳过');
  }

  const nameInput = page.locator('input').first();
  const newValue = `域见•你 ${Date.now() % 10000}`;
  await nameInput.fill(newValue);
  await saveBtn.click();

  const errorBox = page.getByTestId('settings-save-error');
  await page.waitForTimeout(3000);

  if (await errorBox.count()) {
    // 失败路径：必须展示可读原因与建议
    await expect(errorBox).toContainText('原因：');
    await expect(errorBox).toContainText('建议：');
  } else {
    // 成功路径：重新加载页面后应读取到新值
    await gotoAdmin(page, 'quick-settings');
    await expect(page.locator('input').first()).toHaveValue(newValue);
  }
});

test('SEO 种子与手续费：保存动作有明确成功或失败反馈', async ({ page }) => {
  await gotoAdmin(page, 'commission');

  const saveBtn = page.getByTestId('button-save-commission');
  if (!(await saveBtn.count())) {
    test.skip(true, '未以管理员身份登录，跳过');
  }

  await page.getByTestId('preset-8%').click();
  await saveBtn.click();
  await page.waitForTimeout(3000);

  const errorBox = page.getByTestId('commission-save-error');
  if (await errorBox.count()) {
    await expect(errorBox).toContainText('建议：');
  } else {
    await gotoAdmin(page, 'commission');
    await expect(page.getByTestId('input-commission-rate')).toHaveValue('8.0');
  }
});
