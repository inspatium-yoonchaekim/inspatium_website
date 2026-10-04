import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const memberEmails = {
  'sungjun-choi': ['sjchol@inspatium.co', 'tonggyegang@korea.ac.kr'],
  'woojin-an': ['anwoojin@inspatium.co', 'anwoojin@korea.ac.kr'],
  'yoonchae-kim': ['yonchaekim@inspatium.co', 'yonchaekim@ajou.ac.kr'],
  'yoonseo-gu': ['yunseo7560@inspatium.co', 'gys0821@korea.ac.kr'],
};
const pages = ['', '/philosophy', '/greeting', '/about', '/history', '/research', '/research/acoustic-optimization', '/research/few-shot-inverse-design', '/research/embedded-physical-ai', '/research/holography-hardware', '/publications', '/publications/hat-2026', '/team', ...Object.keys(memberEmails).map(id => `/team/${id}`), '/join', '/news', '/contact'];

for (const lang of ['ko', 'en']) {
  test(`${lang}: all pages load without runtime errors or horizontal overflow`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of pages) {
        await page.goto(`/${lang}${route}`);
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        expect(overflow, `${lang}${route} overflows at ${width}px`).toBe(false);
        const brokenImages = await page.locator('img').evaluateAll(images => images.filter(image => image.complete && image.naturalWidth === 0).map(image => image.src));
        expect(brokenImages).toEqual([]);
      }
    }
    expect(errors).toEqual([]);
  });
}

test('language switching preserves the research detail route and member anchor', async ({ page }) => {
  await page.goto('/ko/research/acoustic-optimization');
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(page).toHaveURL(/\/en\/research\/acoustic-optimization$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('/en/team#yoonchae-kim');
  await page.getByRole('link', { name: '한국어로 전환' }).click();
  await expect(page).toHaveURL(/\/ko\/team#yoonchae-kim$/);
  await expect(page.locator('#yoonchae-kim')).toBeInViewport();
});

test('desktop about dropdown, mobile menu and news filtering are operable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ko');
  await page.locator('.about-dropdown summary').click();
  await expect(page.locator('.dropdown-links')).toBeVisible();
  await page.locator('.dropdown-links').getByRole('link', { name: '경영철학' }).click();
  await expect(page).toHaveURL(/\/ko\/philosophy$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await expect(page.getByRole('button', { name: '메뉴 닫기' })).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#main-navigation').getByRole('link', { name: '구성원', exact: true }).click();
  await expect(page).toHaveURL(/\/ko\/team$/);
  await expect(page.getByRole('button', { name: '메뉴 열기' })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#sungjun-choi')).toContainText('sjchol@inspatium.co');
  await page.goto('/ko/news');
  await page.getByRole('button', { name: '언론 보도', exact: true }).click();
  await expect(page.getByRole('button', { name: '언론 보도', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('email actions are addressed correctly and legacy and missing routes resolve', async ({ page }) => {
  await page.goto('/ko/join');
  const mail = page.locator('main a[href^="mailto:"][href*="?subject="]');
  await expect(mail).toHaveAttribute('href', /mailto:sjchol@inspatium\.co\?subject=/);
  await page.goto('/ko/contact');
  await expect(page.locator('main a[href^="mailto:"]').first()).toHaveAttribute('href', /^mailto:sjchol@inspatium\.co/);
  await page.goto('/en/research/acoustic-optimization/index.html');
  await expect(page).toHaveURL(/\/en\/research\/acoustic-optimization$/);
  await page.goto('/ko/team/sungjun-choi');
  await expect(page).toHaveURL(/\/ko\/team\/sungjun-choi$/);
  await expect(page.locator('#sungjun-choi')).toBeVisible();
  await page.goto('/ko/team/not-a-member');
  await expect(page.locator('main')).toContainText('404');
  await page.goto('/ko/research/not-a-project');
  await expect(page.locator('main')).toContainText('404');
  await page.goto('/ko/unknown');
  await expect(page.locator('main')).toContainText('404');
  await page.goto('/ko/team#%');
  await expect(page.locator('h1')).toContainText('구성원');
});

test('home stays compact with readable typography and links to detailed pages', async ({ page }) => {
  for (const lang of ['ko', 'en']) {
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}`);
      await page.evaluate(() => document.fonts.ready);
      const dimensions = await page.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        width: document.documentElement.scrollWidth,
        bodyFontSize: parseFloat(getComputedStyle(document.body).fontSize),
      }));
      const introFontSize = await page.locator('.hero-copy > p').evaluate(element => parseFloat(getComputedStyle(element).fontSize));
      expect(dimensions.height, `${lang} homepage length at ${width}px`).toBeLessThanOrEqual(width > 800 ? 1500 : 1700);
      expect(dimensions.width, `${lang} homepage width at ${width}px`).toBeLessThanOrEqual(width + 1);
      expect(dimensions.bodyFontSize).toBeGreaterThanOrEqual(17);
      expect(introFontSize).toBeGreaterThanOrEqual(18);
      await expect(page.locator(`main a[href="/${lang}/about"]`).first()).toBeVisible();
      await expect(page.locator(`main a[href="/${lang}/research"]`).first()).toBeVisible();
    }
    await page.locator(`main a[href="/${lang}/research"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/research$`));
    await expect(page.locator(`main a[href="/${lang}/research/acoustic-optimization"]`).first()).toBeVisible();
    await page.goto(`/${lang}`);
    await page.locator(`main a[href="/${lang}/about"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/about$`));
  }
});

test('member listings and profiles expose every provided email and retain their language route', async ({ page }) => {
  for (const lang of ['ko', 'en']) {
    await page.goto(`/${lang}/team`);
    for (const [id, emails] of Object.entries(memberEmails)) {
      const member = page.locator(`#${id}`);
      for (const email of emails) {
        await expect(member.getByRole('link', { name: email, exact: true })).toHaveAttribute('href', `mailto:${email}`);
      }
      const profile = member.locator(`a[href="/${lang}/team/${id}"]`).first();
      await profile.click();
      await expect(page).toHaveURL(new RegExp(`/${lang}/team/${id}$`));
      for (const email of emails) {
        await expect(page.locator(`main a[href="mailto:${email}"]`)).toBeVisible();
      }
      await expect(page.locator('.interest-list')).toBeVisible();
      await page.getByRole('link', { name: lang === 'ko' ? 'Switch to English' : '한국어로 전환' }).click();
      await expect(page).toHaveURL(new RegExp(`/${lang === 'ko' ? 'en' : 'ko'}/team/${id}$`));
      await page.goto(`/${lang}/team`);
    }
  }
});

test('primary surfaces, type and borders use a monochrome palette', async ({ page }) => {
  for (const route of pages) {
    await page.goto(`/ko${route}`);
    const coloredStyles = await page.locator('header, main, footer').evaluateAll(regions => {
      const unexpected = new Set();
      for (const region of regions) {
        for (const element of [region, ...region.querySelectorAll('*')]) {
          const style = getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const properties = ['color', 'backgroundColor'];
          for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
            if (parseFloat(style[`border${side}Width`]) > 0) properties.push(`border${side}Color`);
          }
          for (const property of properties) {
            const value = style[property];
            const channels = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
            if (!channels || Number(channels[4] ?? 1) === 0) continue;
            const rgb = channels.slice(1, 4).map(Number);
            if (Math.max(...rgb) - Math.min(...rgb) > 3) unexpected.add(`${property}: ${value}`);
          }
        }
      }
      return [...unexpected];
    });
    expect(coloredStyles, `colored interface styles on /ko${route}`).toEqual([]);
  }
});

test('capture desktop and mobile draft previews', async ({ page }) => {
  await mkdir('docs/previews', { recursive: true });
  for (const [name, route, width, height] of [['home-desktop', '/ko', 1440, 1000], ['home-mobile', '/ko', 390, 844], ['home-english', '/en', 1440, 1000], ['home-english-mobile', '/en', 390, 844], ['team-desktop', '/ko/team', 1440, 1000], ['team-mobile', '/ko/team', 390, 844], ['member-mobile', '/ko/team/sungjun-choi', 390, 844], ['research-desktop', '/ko/research', 1440, 1000]]) {
    await page.setViewportSize({ width, height });
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/previews/${name}.png`, fullPage: true });
  }
});
