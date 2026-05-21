import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.setTimeout(70000);

function env(name) {
  if (process.env[name]) return process.env[name];
  const file = fs.readFileSync('.env.local', 'utf8');
  const line = file.split('\n').find((entry) => entry.startsWith(`${name}=`));
  return line?.slice(name.length + 1);
}

test('dashboard renders and filters', async ({ page }) => {
  const user = env('DASHBOARD_USERNAME');
  const pass = env('DASHBOARD_PASSWORD');
  const baseUrl = process.env.TEST_BASE_URL ?? 'http://localhost:22000';
  const url = new URL(baseUrl);
  url.username = encodeURIComponent(user);
  url.password = encodeURIComponent(pass);
  await page.goto(url.toString());
  await expect(page.getByText('Lead Pipeline')).toBeVisible();
  await expect(page.getByText('Main Funnel')).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('Source Breakdown')).toBeVisible();
  await expect(page.getByText('Lead List')).toBeVisible();
  const total = await page.locator('text=Total Leads').locator('..').textContent();
  if (!total || !/\d/.test(total)) throw new Error('Total leads missing');
  await expect(page.getByLabel('Practice area')).toHaveValue('DLR');
  await page.getByLabel('Practice area').selectOption('PI');
  await expect(page.getByLabel('Practice area')).toHaveValue('PI');
  await page.getByLabel('Practice area').selectOption('DLR');
  await page.getByRole('button', { name: 'Converted' }).click();
  await expect(page.getByText(/leads in current view/i)).toBeVisible();
  await page.getByLabel('Date range').selectOption('7');
  await expect(page.getByLabel('Date range')).toHaveValue('7');
});
