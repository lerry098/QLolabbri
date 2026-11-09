import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'public', 'references');
const useRelay = process.argv.includes('--relay');
const relayCache = new Map();
const relayRequests = [];
const cors = {
  'access-control-allow-origin': 'https://qlolabbri.com',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS',
  'access-control-allow-headers': '*',
};
function readerJson(text) {
  const marker = 'Markdown Content:\n';
  const start = text.indexOf(marker);
  if (start < 0) throw new Error('Relay did not return a reader response');
  const data = JSON.parse(text.slice(start + marker.length).trim());
  if (data.statusCode !== 200 || !['success', '000'].includes(data.status)) throw new Error('Upstream API did not return success');
  return JSON.stringify(data);
}
if (useRelay) {
  // Reuse the response obtained through the public relay during this inspection.
  for (const [file, url] of [
    ['proxy-api-response.txt', 'https://qlola.bri.co.id/api/ui/v1.1.0/public/userInterface/ID'],
    ['proxy-banner-response.txt', 'https://qlola.bri.co.id/api/general/v2.0/public/banner/LOGIN/0'],
  ]) {
    const cached = await readFile(path.join(root, 'artifacts', file), 'utf8').catch(() => '');
    if (cached) {
      try {
        relayCache.set(url, Promise.resolve({ status: 200, contentType: 'application/json', body: Buffer.from(readerJson(cached)) }));
      } catch {}
    }
  }
}
async function relayResponse(url, isPublicApi) {
  if (!relayCache.has(url)) relayCache.set(url, (async () => {
    const endpoint = isPublicApi
      ? `https://r.jina.ai/${url}`
      : `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(35000), redirect: 'follow' });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) throw new Error(`Relay HTTP ${response.status}`);
    if (isPublicApi) return { status: 200, contentType: 'application/json', body: Buffer.from(readerJson(await response.text())) };
    if (!contentType.startsWith('image/')) throw new Error(`Relay returned ${contentType} instead of image`);
    return { status: 200, contentType, body: Buffer.from(await response.arrayBuffer()) };
  })());
  return relayCache.get(url);
}
await mkdir(output, { recursive: true });
await mkdir(path.join(root, 'artifacts'), { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const reports = [];
try {
  for (const device of [
    { name: 'desktop', width: 1440, height: 1000, mobile: false },
    { name: 'mobile', width: 390, height: 844, mobile: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: 1,
      isMobile: device.mobile,
      hasTouch: device.mobile,
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    const failures = [];
    await page.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const isPublicApi = url.hostname === 'qlola.bri.co.id' && url.pathname.includes('/public/');
      const isPublicImage = isPublicApi && url.pathname.includes('/banner/image/');
      const isCdnImage = url.hostname === 's3.bri.co.id' && /\.(png|jpe?g|webp|svg|ico)$/i.test(url.pathname);
      const isNextImage = url.hostname === 'qlolabbri.com' && url.pathname === '/_next/image';
      if (useRelay && isPublicApi && request.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': request.headers()['access-control-request-headers'] || '*' } });
      }
      if (!['GET', 'HEAD'].includes(request.method())) return route.abort('blockedbyclient');
      if (useRelay && (isPublicApi || isCdnImage || isNextImage)) {
        const assetUrl = isNextImage ? url.searchParams.get('url') : request.url();
        try {
          if (!assetUrl || (isNextImage && new URL(assetUrl).hostname !== 's3.bri.co.id')) throw new Error('Unsupported image URL');
          const jsonApi = isPublicApi && !isPublicImage;
          const result = await relayResponse(assetUrl, jsonApi);
          relayRequests.push({ device: device.name, url: request.url(), provider: jsonApi ? 'r.jina.ai' : 'images.weserv.nl', status: result.status });
          return route.fulfill({ ...result, headers: cors });
        } catch (error) {
          relayRequests.push({ device: device.name, url: request.url(), error: error.message });
          return route.abort('failed');
        }
      }
      return route.continue();
    });
    page.on('requestfailed', request => failures.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => {
      if (response.status() >= 400) failures.push({ url: response.url(), status: response.status() });
    });
    console.log(`Opening ${device.name}${useRelay ? ' with public asset/API relays' : ''}...`);
    const response = await page.goto('https://qlolabbri.com/token', { waitUntil: 'load', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y);
        await new Promise(resolve => setTimeout(resolve, 180));
      }
      await Promise.all([...document.images].map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
          setTimeout(resolve, 12000);
        });
      }));
      window.scrollTo(0, 0);
    });
    // Require the page layout and image dimensions to settle before capture.
    let last = '';
    let stable = 0;
    for (let attempt = 0; attempt < 20 && stable < 3; attempt++) {
      const layout = await page.evaluate(() => JSON.stringify({
        height: document.documentElement.scrollHeight,
        fonts: document.fonts.status,
        images: [...document.images].filter(img => img.getClientRects().length)
          .map(img => [img.complete, img.naturalWidth, img.clientWidth, img.clientHeight]),
      }));
      stable = layout === last ? stable + 1 : 0;
      last = layout;
      await page.waitForTimeout(600);
    }
    const report = await page.evaluate(() => ({
      title: document.title,
      url: location.href,
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
      fontStatus: document.fonts.status,
      visibleImages: [...document.images].filter(img => img.getClientRects().length).map(img => ({
        src: img.currentSrc || img.src,
        loaded: img.complete && img.naturalWidth > 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
      })),
      bodyText: document.body.innerText,
      backgroundImages: [...new Set([...document.querySelectorAll('*')]
        .filter(element => element.getClientRects().length)
        .flatMap(element => [...getComputedStyle(element).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => match[1])))],
    }));
    const file = `reference-${useRelay ? 'proxy-' : ''}${device.name}.png`;
    await page.screenshot({ path: path.join(output, file), fullPage: true, animations: 'disabled', timeout: 30000 });
    reports.push({ device, mode: useRelay ? 'live-javascript-with-public-asset-api-relays' : 'live-javascript', status: response?.status(), stableSamples: stable, ...report, failures, screenshot: `public/references/${file}` });
    console.log(JSON.stringify({ device: device.name, status: response?.status(), title: report.title, height: report.height,
      stableSamples: stable, loadedImages: report.visibleImages.filter(img => img.loaded).length,
      brokenImages: report.visibleImages.filter(img => !img.loaded), failures: failures.length }));
    await context.close();
  }
  const result = JSON.stringify({ capturedAt: new Date().toISOString(), transport: useRelay ? 'Direct main document; public GET-only image/API relays' : 'direct', relayRequests, reports }, null, 2);
  await writeFile(path.join(root, 'artifacts', useRelay ? 'proxy-capture-report.json' : 'capture-report.json'), result);
  await writeFile(path.join(root, 'public', 'report.json'), result);
} finally {
  await browser.close();
}
