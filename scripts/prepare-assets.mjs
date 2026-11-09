import { mkdir, writeFile } from 'node:fs/promises';
const directory = new URL('../app-public/assets/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const [file, source] of [
  ['hero.jpg', 'https://s3.bri.co.id/wdp-qllapp/assets/images/bg_baru_2.jpg'],
  ['footer.jpg', 'https://s3.bri.co.id/wdp-qllapp/assets/images/Footer-bg-new.jpg'],
  ['tracking.png', 'https://s3.bri.co.id/wdp-qllapp/assets/images/login/TrackingLogin.png'],
  ['cash.png', 'https://s3.bri.co.id/wdp-qllapp/assets/images/eform/eform_banner_7.png'],
]) {
  let saved = false;
  for (const url of [source, `https://images.weserv.nl/?url=${encodeURIComponent(source)}`]) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('Image unavailable');
      await writeFile(new URL(file, directory), Buffer.from(await response.arrayBuffer()));
      saved = true;
      console.log(`Saved ${file}`);
      break;
    } catch { /* The second, public image-only source is an optional fallback. */ }
  }
  if (!saved) throw new Error(`Cannot obtain reference asset ${file}`);
}
