import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = new URL('./', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
await Promise.all([
  ['bbb', 'https://www.bb-b.net/'],
  ['dvo', 'https://dvo.it/'],
  ['sinedogma', 'https://sinedogma.com.tr/'],
].map(async ([name, url]) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: new URL(`${name}-viewport.png`, output).pathname.slice(1), fullPage: false });
    await page.screenshot({ path: new URL(`${name}-full.png`, output).pathname.slice(1), fullPage: true });
    const details = await page.evaluate(() => ({
      title: document.title,
      viewportHeight: innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      text: document.body.innerText.slice(0, 14000),
      fonts: [...document.querySelectorAll('h1,h2,p,nav,a')].filter(el => el.getBoundingClientRect().height && el.getBoundingClientRect().top < innerHeight).slice(0, 25).map(el => ({ text: el.textContent.trim().slice(0, 140), size: getComputedStyle(el).fontSize, family: getComputedStyle(el).fontFamily }))
    }));
    console.log(JSON.stringify({ name, ...details }));
  } catch (error) { console.log(JSON.stringify({ name, error: String(error) })); }
  await page.close();
}));
await browser.close();
