import { test, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const content = JSON.parse(await readFile(new URL('../src/content.json', import.meta.url), 'utf8'));
const publicProjects = content.projects.filter(project => project.visibility !== 'hidden');
const researchRoutes = publicProjects.map(project => `/research/${project.id}`);
const publicPublications = content.publications.filter(paper => paper.visibility !== 'hidden');
const publicationRoutes = publicPublications.map(paper => `/publications/${paper.id}`);
const publicNews = content.news.filter(item => item.visibility === 'public');
const newsRoutes = publicNews.map(item => `/news/${item.id}`);

const memberEmails = {
  'sungjun-choi': ['sjchol@inspatium.co', 'tonggyegang@korea.ac.kr'],
  'woojin-an': ['anwoojin@inspatium.co', 'anwoojin@korea.ac.kr'],
  'yoonchae-kim': ['yonchaekim@inspatium.co', 'yonchaekim@ajou.ac.kr'],
  'yoonseo-gu': ['yunseo7560@inspatium.co', 'gys0821@korea.ac.kr'],
};
const pages = ['', '/philosophy', '/greeting', '/about', '/history', '/research', ...researchRoutes, '/publications', ...publicationRoutes, '/team', ...Object.keys(memberEmails).map(id => `/team/${id}`), '/join', '/news', ...newsRoutes, '/contact'];

for (const lang of ['ko', 'en']) {
  test(`${lang}: all pages load without runtime errors or horizontal overflow`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of pages) {
        await page.goto(`/${lang}${route}`);
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('main')).not.toContainText('404');
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

test('locale home and detail pages survive direct navigation and refresh', async ({ page }) => {
  for (const lang of ['ko', 'en']) {
    for (const route of ['', '/team/sungjun-choi', '/research/few-shot-inverse-design']) {
      const path = `/${lang}${route}?source=refresh`;
      const response = await page.goto(path);
      expect(response.status(), path).toBe(200);
      const heading = await page.locator('h1').textContent();
      const reloaded = await page.reload();
      expect(reloaded.status(), path).toBe(200);
      await expect(page).toHaveURL(new RegExp(`${path.replace('?', '\\?')}$`));
      await expect(page.locator('h1')).toHaveText(heading);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
    }
  }
});

test('language switching preserves the research detail route and member anchor', async ({ page }) => {
  await page.goto('/ko/research/few-shot-inverse-design');
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(page).toHaveURL(/\/en\/research\/few-shot-inverse-design$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('/en/team#yoonchae-kim');
  await page.getByRole('link', { name: '한국어로 전환' }).click();
  await expect(page).toHaveURL(/\/ko\/team#yoonchae-kim$/);
  await expect(page.locator('#yoonchae-kim')).toBeInViewport();
});

test('research visibility controls links and direct routes while preserving other pages', async ({ page }) => {
  const projectId = 'acoustic-optimization';
  const project = content.projects.find(item => item.id === projectId);
  const hidden = project.visibility === 'hidden';
  const publicIds = content.projects.filter(item => item.visibility !== 'hidden').map(item => item.id);
  const relatedPublicationRoutes = new Set(publicPublications.filter(paper => paper.project === projectId).map(paper => `publications/${paper.id}`));
  for (const lang of ['ko', 'en']) {
    const projectField = key => lang === 'en' ? project[`${key}_en`] ?? project[key] : project[key];
    await page.goto(`/${lang}/research`);
    await expect(page.locator('.research-list-item')).toHaveCount(publicIds.length);
    if (hidden) await expect(page.locator(`main a[href*="/research/${projectId}"]`)).toHaveCount(0);
    for (const id of publicIds) {
      await expect(page.locator(`main a[href="/${lang}/research/${id}"]`).first()).toBeVisible();
    }

    for (const route of ['history', 'news', 'publications', ...publicationRoutes.map(route => route.slice(1)), 'team', ...Object.keys(memberEmails).map(id => `team/${id}`)]) {
      await page.goto(`/${lang}/${route}`);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('main')).not.toContainText('404');
      if (hidden) {
        await expect(page.locator(`main a[href*="/research/${projectId}"]`)).toHaveCount(0);
        await expect(page.locator('main')).not.toContainText('7.86');
      } else if (route === 'history' || relatedPublicationRoutes.has(route) || (route.startsWith('team/') && project.people.includes(route.slice('team/'.length)))) {
        await expect(page.locator(`main a[href="/${lang}/research/${projectId}"]`).first()).toBeVisible();
      }
    }

    const assertDetailVisibility = async () => {
      if (hidden) {
        await expect(page.locator('h1')).toHaveText(lang === 'ko' ? '페이지를 찾을 수 없습니다.' : 'Page not found.');
        await expect(page.locator('main')).not.toContainText(projectField('title'));
        await expect(page.locator('main')).not.toContainText('7.86');
        await expect(page).not.toHaveTitle(`${projectField('title')} | INSPATIUM`);
        await expect(page.locator('meta[property="og:title"]')).not.toHaveAttribute('content', `${projectField('title')} | INSPATIUM`);
        for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) {
          await expect(page.locator(selector)).not.toHaveAttribute('content', projectField('summary'));
        }
      } else {
        await expect(page.locator('h1')).toHaveText(projectField('title'));
        await expect(page.locator('main')).toContainText(projectField('outcome'));
        await expect(page).toHaveTitle(`${projectField('title')} | INSPATIUM`);
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', `${projectField('title')} | INSPATIUM`);
        for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) {
          await expect(page.locator(selector)).toHaveAttribute('content', projectField('summary'));
        }
      }
    };
    const projectPath = `/${lang}/research/${projectId}`;
    for (const suffix of ['', '?source=hidden-check', '/index.html?source=hidden-check']) {
      await page.goto(`${projectPath}${suffix}`);
      await expect(page).toHaveURL(`${projectPath}${suffix.replace('/index.html', '')}`);
      await assertDetailVisibility();
      await page.reload();
      await assertDetailVisibility();
    }
  }
});

test('publication visibility controls listings, related links and direct routes while retaining the index', async ({ page }) => {
  const incomingRoutes = ['', '/history', '/news', '/research', ...publicProjects.map(project => `/research/${project.id}`), '/team', ...Object.keys(memberEmails).map(id => `/team/${id}`)];
  const hiddenPapers = content.publications.filter(paper => paper.visibility === 'hidden');
  for (const lang of ['ko', 'en']) {
    const localized = (item, key) => lang === 'en' ? item[`${key}_en`] ?? item[key] : item[key];
    const authors = paper => paper.authors?.length ? paper.authors.map(author => localized(author, 'name')).join(' · ') : localized(paper, 'author_note');
    const assertPublicationRow = async (row, paper) => {
      await expect(row.locator('.publication-author-note')).toHaveText(authors(paper));
      await expect(row.locator('.publication-meta .status-label')).toHaveText(localized(paper, 'status'));
      if (paper.authors?.length) {
        await expect(row).not.toContainText(lang === 'ko' ? '전체 저자 표기 등록 예정' : 'Full author list to be added');
      }
    };
    const indexPath = `/${lang}/publications`;
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}`);
      if (width === 390) await page.getByRole('button', { name: lang === 'ko' ? '메뉴 열기' : 'Open menu' }).click();
      await page.locator('#main-navigation').getByRole('link', { name: lang === 'ko' ? '논문' : 'Publications', exact: true }).click();
      await expect(page).toHaveURL(indexPath);
      await expect(page.locator('h1')).toHaveText(lang === 'ko' ? '논문' : 'Publications');
      await expect(page.locator('.publications-list .publication-row')).toHaveCount(publicPublications.length);
      if (publicPublications.length === 0) {
        await expect(page.locator('.publications-empty h2')).toHaveText(lang === 'ko' ? '현재 공개된 논문이 없습니다.' : 'No publications are currently available.');
      } else {
        await expect(page.locator('.publications-empty')).toHaveCount(0);
      }
      for (const paper of content.publications) {
        const link = page.locator(`main a[href="${indexPath}/${paper.id}"]`).first();
        if (paper.visibility === 'hidden') {
          await expect(link).toHaveCount(0);
          await expect(page.locator('main')).not.toContainText(localized(paper, 'title'));
        } else {
          await expect(link).toHaveText(localized(paper, 'title'));
          await expect(link).toBeVisible();
          const row = page.locator('.publication-row').filter({ has: page.locator(`h2 a[href="${indexPath}/${paper.id}"]`) });
          await assertPublicationRow(row, paper);
        }
      }
    }

    for (const route of incomingRoutes) {
      await page.goto(`/${lang}${route}`);
      for (const paper of hiddenPapers) {
        await expect(page.locator(`main a[href*="/publications/${paper.id}"]`)).toHaveCount(0);
      }
      const project = publicProjects.find(item => route === `/research/${item.id}`);
      if (project) {
        const linkedPaper = publicPublications.find(paper => paper.id === project.publication);
        await expect(page.locator('.related-publication')).toHaveCount(linkedPaper ? 1 : 0);
        if (linkedPaper) {
          await expect(page.locator(`.related-publication a[href="${indexPath}/${linkedPaper.id}"]`).first()).toBeVisible();
          await assertPublicationRow(page.locator('.related-publication .publication-row'), linkedPaper);
        }
      }
    }

    for (const paper of content.publications) {
      const paperTitle = localized(paper, 'title');
      const assertDetailVisibility = async () => {
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        if (paper.visibility === 'hidden') {
          await expect(page.locator('h1')).toHaveText(lang === 'ko' ? '페이지를 찾을 수 없습니다.' : 'Page not found.');
          await expect(page.locator('.publication-detail')).toHaveCount(0);
          for (const value of [paperTitle, paper.original_title, paper.venue, paper.date, localized(paper, 'author_note')].filter(Boolean)) {
            await expect(page.locator('main')).not.toContainText(value);
          }
          await expect(page).not.toHaveTitle(`${paperTitle} | INSPATIUM`);
          for (const selector of ['meta[property="og:title"]', 'meta[name="description"]', 'meta[property="og:description"]']) {
            await expect(page.locator(selector)).not.toHaveAttribute('content', new RegExp(paperTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
          }
        } else {
          await expect(page.locator('.publication-detail-title')).toHaveText(paperTitle);
          await expect(page.locator('.publication-detail')).toContainText(paper.venue);
          await expect(page.locator('.publication-detail').getByText(authors(paper), { exact: true })).toBeVisible();
          if (paper.authors?.length) {
            await expect(page.locator('.publication-detail')).not.toContainText(lang === 'ko' ? '전체 저자 표기 등록 예정' : 'Full author list to be added');
          }
          await expect(page.locator('.paper-status .status-label')).toHaveText(localized(paper, 'status'));
          await expect(page.locator('.paper-status')).toContainText(paper.date);
          await expect(page).toHaveTitle(`${paperTitle} | INSPATIUM`);
          await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', `${paperTitle} | INSPATIUM`);
          const project = publicProjects.find(item => item.id === paper.project);
          await expect(page.locator('.project-band')).toHaveCount(project ? 1 : 0);
          if (project) await expect(page.locator(`.project-band a[href="/${lang}/research/${project.id}"]`)).toBeVisible();
          const resources = page.locator('.publication-resources');
          if (paper.public_release === false) {
            await expect(resources.locator('a')).toHaveCount(0);
          } else if (paper.public_release) {
            const doiUrl = paper.doi && (paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`);
            const resourceLinks = [
              [lang === 'ko' ? '학술지에서 보기' : 'View at publisher', paper.url],
              [/^DOI(?::|$)/, doiUrl],
              [lang === 'ko' ? '코드와 데이터' : 'Code and data', paper.code_url],
            ];
            await expect(resources.locator('a')).toHaveCount(resourceLinks.filter(([, url]) => url).length);
            for (const [label, url] of resourceLinks) {
              const link = resources.getByRole('link', { name: label, exact: true });
              if (url) {
                await expect(link).toHaveAttribute('href', url);
                await expect(link).toHaveAttribute('target', '_blank');
                await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
                if (label instanceof RegExp) await expect(link).toContainText(paper.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, ''));
              } else {
                await expect(link).toHaveCount(0);
              }
            }
            if (paper.url) await expect(resources).not.toContainText(lang === 'ko' ? '논문 공개 링크 준비 중' : 'Publication link to be added');
            if (paper.doi) await expect(resources).not.toContainText(lang === 'ko' ? 'DOI 등록 예정' : 'DOI to be added');
            await expect(resources).not.toContainText(lang === 'ko' ? '코드·데이터 공개 정보 준비 중' : 'Code and data information to be added');
          }
          if (paper.article_number) await expect(page.locator('.publication-bibliography')).toContainText(paper.article_number);
          if (paper.open_access) await expect(page.locator('.publication-bibliography')).toContainText(lang === 'ko' ? '오픈 액세스' : 'Open access');
          if (paper.license) await expect(page.locator('.publication-bibliography')).toContainText(paper.license);
          if (paper.license_url && paper.public_release === true) {
            const license = page.locator('.publication-bibliography').getByRole('link', { name: paper.license, exact: true });
            await expect(license).toHaveAttribute('href', paper.license_url);
            await expect(license).toHaveAttribute('target', '_blank');
            await expect(license).toHaveAttribute('rel', 'noopener noreferrer');
          } else if (paper.license_url) {
            await expect(page.locator('.publication-bibliography a')).toHaveCount(0);
          }
        }
      };
      const paperPath = `${indexPath}/${paper.id}`;
      for (const suffix of ['', '?source=visibility-check', '/index.html?source=visibility-check']) {
        await page.goto(`${paperPath}${suffix}`);
        await expect(page).toHaveURL(`${paperPath}${suffix.replace('/index.html', '')}`);
        await assertDetailVisibility();
        await page.reload();
        await assertDetailVisibility();
      }
    }
  }
});

for (const lang of ['ko', 'en']) {
  test(`${lang}: media coverage lists all 19 sources with JoongAng first and accessible original links`, async ({ page }) => {
    const mediaItems = publicNews.filter(item => item.category === 'media');
    const leadId = 'media-joongang-20261013';
    const lead = mediaItems.find(item => item.id === leadId);
    const localized = (item, key) => lang === 'en' ? item[`${key}_en`] ?? item[key] : item[key];
    expect(mediaItems).toHaveLength(19);
    expect(lead).toBeDefined();
    await page.goto(`/${lang}/news`);
    const rows = page.locator('.news-list-item');
    const assertLead = async () => {
      await expect(rows.first().locator('h2 a')).toHaveAttribute('href', `/${lang}/news/${leadId}`);
      await expect(rows.first().locator('.news-item-meta')).toContainText(localized(lead, 'outlet'));
    };
    await expect(page.getByRole('button', { name: lang === 'ko' ? '전체' : 'All', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(rows).toHaveCount(publicNews.length);
    await assertLead();
    await page.getByRole('button', { name: lang === 'ko' ? '언론 보도' : 'Media', exact: true }).click();
    await expect(page.getByRole('button', { name: lang === 'ko' ? '언론 보도' : 'Media', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(rows).toHaveCount(19);
    await assertLead();
    for (const item of mediaItems) {
      const row = rows.filter({ has: page.locator(`h2 a[href="/${lang}/news/${item.id}"]`) });
      await expect(row).toHaveCount(1);
      await expect(row.locator('h2')).toHaveText(localized(item, 'title'));
      await expect(row.locator('p')).toHaveText(localized(item, 'summary'));
      await expect(row.locator('.news-item-meta')).toContainText(localized(item, 'outlet'));
      if (item.date) {
        await expect(row.locator('time')).toHaveAttribute('datetime', item.date);
        await expect(row.locator('time')).toHaveText(item.date);
      } else {
        await expect(row.locator('time')).toHaveCount(0);
      }
    }
    await page.getByRole('button', { name: lang === 'ko' ? '연구 소식' : 'Research', exact: true }).click();
    await expect(page.getByRole('button', { name: lang === 'ko' ? '연구 소식' : 'Research', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(rows).toHaveCount(0);
    await expect(page.locator('.inner-news-empty h2')).toHaveText(lang === 'ko' ? '해당 분류의 소식이 없습니다.' : 'There are no updates in this category.');
    await page.getByRole('button', { name: lang === 'ko' ? '전체' : 'All', exact: true }).click();
    await expect(rows).toHaveCount(publicNews.length);
    await assertLead();

    for (const item of mediaItems) {
      await page.goto(`/${lang}/news/${item.id}`);
      await expect(page.locator('h1')).toHaveText(localized(item, 'title'));
      await expect(page).toHaveTitle(`${localized(item, 'title')} | INSPATIUM`);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', `${localized(item, 'title')} | INSPATIUM`);
      for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) {
        await expect(page.locator(selector)).toHaveAttribute('content', localized(item, 'summary'));
      }
      await expect(page.locator('.news-detail .eyebrow')).toContainText(localized(item, 'outlet'));
      if (item.date) await expect(page.locator('.news-detail .eyebrow')).toContainText(item.date);
      const original = page.locator('.news-detail').getByRole('link', { name: lang === 'ko' ? '원문 보기' : 'Read original', exact: true });
      await expect(original).toHaveAttribute('href', item.url);
      await expect(original).toHaveAttribute('target', '_blank');
      await expect(original).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(page.locator(`.news-detail .project-band a[href="/${lang}/research/acoustic-optimization"]`)).toBeVisible();
    }

    const detailPath = `/${lang}/news/${leadId}?source=refresh`;
    await page.goto(detailPath);
    await page.reload();
    await expect(page).toHaveURL(detailPath);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('h1')).toHaveText(localized(lead, 'title'));
    for (const paragraph of localized(lead, 'body')) await expect(page.locator('.news-detail')).toContainText(paragraph);
    await expect(page.locator('.news-detail .eyebrow')).toContainText(localized(lead, 'outlet'));
    if (lead.date) await expect(page.locator('.news-detail .eyebrow')).toContainText(lead.date);
    await expect(page.locator('.news-detail a[target="_blank"]')).toHaveAttribute('href', lead.url);
    await page.getByRole('link', { name: lang === 'ko' ? 'Switch to English' : '한국어로 전환' }).click();
    await expect(page).toHaveURL(`/${lang === 'ko' ? 'en' : 'ko'}/news/${leadId}?source=refresh`);
    await expect(page.locator('h1')).toHaveText(lang === 'ko' ? lead.title_en : lead.title);
  });
}

test('desktop about dropdown, mobile menu and news filtering are operable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ko');
  await page.locator('.about-dropdown summary').click();
  await expect(page.locator('.dropdown-links')).toBeVisible();
  await page.locator('.dropdown-links').getByRole('link', { name: '연구철학' }).click();
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
  await page.goto('/en/research/few-shot-inverse-design/index.html');
  await expect(page).toHaveURL(/\/en\/research\/few-shot-inverse-design$/);
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
    await expect(page.locator(`main a[href="/${lang}/research/few-shot-inverse-design"]`).first()).toBeVisible();
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
  // Capture settled content, including elements below the viewport.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mkdir('docs/previews', { recursive: true });
  for (const [name, route, width, height] of [['home-desktop', '/ko', 1440, 1000], ['home-mobile', '/ko', 390, 844], ['home-english', '/en', 1440, 1000], ['home-english-mobile', '/en', 390, 844], ['team-desktop', '/ko/team', 1440, 1000], ['team-mobile', '/ko/team', 390, 844], ['member-mobile', '/ko/team/sungjun-choi', 390, 844], ['research-desktop', '/ko/research', 1440, 1000]]) {
    await page.setViewportSize({ width, height });
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/previews/${name}.png`, fullPage: true });
  }
});
