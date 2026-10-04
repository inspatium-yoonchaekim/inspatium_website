import { test, expect } from '@playwright/test';

test('text entrances finish with readable Korean and English headings and copy', async ({ page }) => {
  for (const lang of ['ko', 'en']) {
    await page.goto(`/${lang}`);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveAccessibleName(lang === 'ko'
      ? /피지컬 AI의 미래,.*역설계에서 시작됩니다\./
      : /The future of physical AI\..*It begins with inverse design\./);
    await expect(heading.locator('.split-char').first()).toBeAttached();
    await expect.poll(() => heading.locator('.split-char').evaluateAll(words =>
      words.every(word => Number(getComputedStyle(word).opacity) > 0.99)
    )).toBe(true);
    await expect.poll(() => page.locator('.hero-copy .blur-word').evaluateAll(words =>
      words.length > 0 && words.every(word => Number(getComputedStyle(word).opacity) > 0.99
        && getComputedStyle(word).filter === 'blur(0px)')
    )).toBe(true);
  }
});

test('smooth wheel scrolling settles and navigation stops inertia at the new page top', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ko/about');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  const lastWords = page.locator('.inner-prose .scroll-reveal').last().locator('.reveal-word');
  const initialOpacity = await lastWords.last().evaluate(word => Number(getComputedStyle(word).opacity));
  expect(initialOpacity).toBeLessThan(1);
  // Measure several frames of one wheel input: Lenis should interpolate, then settle.
  await page.mouse.move(180, 450);
  const samplesPromise = page.evaluate(() => new Promise(resolve => {
    const samples = [];
    const frame = () => {
      samples.push(window.scrollY);
      if (samples.length === 24) resolve(samples);
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }));
  await page.mouse.wheel(0, 550);
  const samples = await samplesPromise;
  expect(new Set(samples).size).toBeGreaterThan(4);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  await page.mouse.wheel(0, 10000);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollHeight - innerHeight - scrollY
  )).toBeLessThanOrEqual(1);
  await expect.poll(() => lastWords.evaluateAll(words =>
    words.every(word => Number(getComputedStyle(word).opacity) > 0.99)
  )).toBe(true);
  await page.locator('.inner-prose > a.button').click();
  await expect(page).toHaveURL(/\/ko\/research$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  // A later frame must not carry momentum from the previous page into this route.
  await page.evaluate(() => new Promise(resolve => {
    let frames = 0;
    const frame = () => ++frames === 20 ? resolve() : requestAnimationFrame(frame);
    requestAnimationFrame(frame);
  }));
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('reduced motion keeps gentle entrances and smooth scrolling without breaking anchors', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/ko/about');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await expect(page.locator('h1 .split-word').first()).toBeAttached();
  await expect.poll(() => page.locator('.reveal-word').evaluateAll(words =>
    words.every(word => getComputedStyle(word).filter === 'none')
  )).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await expect(page.locator('h1 .split-word').first()).toBeAttached();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await expect(page.locator('h1 .split-word').first()).toBeAttached();
  await page.goto('/ko/team#yoonchae-kim');
  await expect(page.locator('#yoonchae-kim')).toBeInViewport();
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(page).toHaveURL(/\/en\/team#yoonchae-kim$/);
  await expect(page.locator('#yoonchae-kim')).toBeInViewport();
  const anchorPosition = await page.evaluate(() => window.scrollY);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('html')).toHaveClass(/lenis/);
  expect(await page.evaluate(() => window.scrollY)).toBe(anchorPosition);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveClass(/lenis/);
  expect(await page.evaluate(() => window.scrollY)).toBe(anchorPosition);
});
