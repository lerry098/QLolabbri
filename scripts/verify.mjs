import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from '../server.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(path.join(root, 'artifacts'), { recursive: true });
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  assert.equal((await fetch(`${origin}/token`)).status, 200);
  assert.equal((await fetch(`${origin}/test.php`, { method: 'POST', body: 'dummy' })).status, 405);
  assert.equal((await fetch(`${origin}/package.json`)).status, 404);
  const response = await fetch(`${origin}/`);
  assert.match(response.headers.get('content-security-policy'), /form-action 'none'/);
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  const externalRequests = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => {
    if (!request.url().startsWith(`${origin}/`)) externalRequests.push(request.url());
  });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const img = document.querySelector('#capture');
    return img.complete && img.naturalWidth === 1440;
  });
  assert.equal(await page.locator('input, form, textarea, [contenteditable=true]').count(), 0);
  assert.match(await page.title(), /DEMO/);
  assert.equal(await page.locator('.demo-label').textContent(), 'DEMO');
  assert.equal(await page.locator('h1, h2, .report, .notice, footer').count(), 0);
  assert.doesNotMatch(await page.locator('body').innerText(), /Visual Review|Catatan Pemeriksaan|Tinjauan tampilan|Unduh laporan/i);
  assert.equal(await page.locator('button, .preview-toolbar, script').count(), 0);
  assert.equal(await page.locator('.demo-label').isVisible(), true);
  assert(await page.locator('#capture').evaluate(img => img.complete && img.naturalWidth > 0));
  await page.screenshot({ path: path.join(root, 'artifacts', 'review-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => {
    const img = document.querySelector('#capture');
    return img.complete && img.naturalWidth === 390;
  });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: path.join(root, 'artifacts', 'review-mobile.png'), fullPage: true });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const img = document.querySelector('#capture');
    return img.complete && img.naturalWidth === 390;
  });
  for (const width of [320, 600, 601]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForFunction(expected => {
      const img = document.querySelector('#capture');
      return img.complete && img.naturalWidth === expected;
    }, width <= 600 ? 390 : 1440);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForFunction(() => {
    const img = document.querySelector('#capture');
    return img.complete && img.naturalWidth === 1440;
  });
  const noScriptContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto(origin, { waitUntil: 'networkidle' });
  assert(await noScriptPage.locator('#capture').evaluate(img => img.complete && img.naturalWidth === 390));
  await noScriptContext.close();
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(externalRequests, []);
  console.log('PASS: desktop/ponsel otomatis, batas 600/601 px, tanpa JavaScript, tanpa toolbar/tombol/penjelasan, DEMO terlihat, tanpa input/form atau koneksi eksternal.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
