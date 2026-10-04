import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { build } from 'vite';
import { publicContentPlugin } from '../scripts/content-visibility.mjs';

test('built browser files exclude hidden research, its links, draft news and unpublished paper links, and restore research on publication', async () => {
  const prefix = join(tmpdir(), 'inspatium-visibility-test-');
  const fixture = await mkdtemp(prefix);
  try {
    await mkdir(join(fixture, 'src'));
    await writeFile(join(fixture, 'index.html'), '<html><body><script type="module" src="/src/main.js"></script></body></html>');
    await writeFile(join(fixture, 'src', 'main.js'), 'import content from "./content.json";document.body.textContent=JSON.stringify(content);');
    const content = { site: { name: 'Inspatium' }, projects: [
      { id: 'PRIVATE_PROJECT_ID_SENTINEL', visibility: 'hidden', title: 'PRIVATE_PROJECT_TITLE_SENTINEL', outcome: 'PRIVATE_PROJECT_RESULT_SENTINEL' },
      { id: 'public-project', visibility: 'public', title: 'PUBLIC_PROJECT_SENTINEL' },
      { id: 'legacy-project', title: 'LEGACY_PROJECT_SENTINEL' },
    ], history: [
      { title: 'HISTORY_ENTRY_SENTINEL', project: 'PRIVATE_PROJECT_ID_SENTINEL' },
      { title: 'PUBLIC_HISTORY_ENTRY_SENTINEL', project: 'public-project' },
    ], news: [
      { id: 'published', visibility: 'public', title: 'PUBLISHED_NEWS_SENTINEL', project: 'PRIVATE_PROJECT_ID_SENTINEL' },
      { id: 'draft', visibility: 'draft', title: 'PRIVATE_DRAFT_SENTINEL' },
      { id: 'missing-visibility', title: 'UNAPPROVED_NEWS_SENTINEL' },
    ], publications: [
      { id: 'private-paper', title: 'APPROVED_PAPER_TITLE', project: 'PRIVATE_PROJECT_ID_SENTINEL', public_release: false, doi: 'PRIVATE_DOI_SENTINEL', url: 'PRIVATE_URL_SENTINEL', code_url: 'PRIVATE_CODE_SENTINEL' },
      { id: 'public-paper', public_release: true, url: 'PUBLIC_PAPER_URL_SENTINEL' },
    ] };
    const buildBundle = async () => {
      await writeFile(join(fixture, 'src', 'content.json'), JSON.stringify(content));
      await build({ root: fixture, configFile: false, plugins: [publicContentPlugin()], logLevel: 'silent' });
      const assetsDir = join(fixture, 'dist', 'assets');
      return (await Promise.all((await readdir(assetsDir)).map(file => readFile(join(assetsDir, file), 'utf8')))).join('\n');
    };
    const bundle = await buildBundle();
    for (const sentinel of ['PUBLISHED_NEWS_SENTINEL', 'APPROVED_PAPER_TITLE', 'PUBLIC_PAPER_URL_SENTINEL', 'PUBLIC_PROJECT_SENTINEL', 'LEGACY_PROJECT_SENTINEL', 'HISTORY_ENTRY_SENTINEL', 'PUBLIC_HISTORY_ENTRY_SENTINEL', 'public-project']) assert.ok(bundle.includes(sentinel), `${sentinel} remains public`);
    for (const sentinel of ['PRIVATE_PROJECT_ID_SENTINEL', 'PRIVATE_PROJECT_TITLE_SENTINEL', 'PRIVATE_PROJECT_RESULT_SENTINEL', 'PRIVATE_DRAFT_SENTINEL', 'UNAPPROVED_NEWS_SENTINEL', 'PRIVATE_DOI_SENTINEL', 'PRIVATE_URL_SENTINEL', 'PRIVATE_CODE_SENTINEL']) assert.ok(!bundle.includes(sentinel), `${sentinel} stays private`);

    content.projects[0].visibility = 'public';
    const restoredBundle = await buildBundle();
    for (const sentinel of ['PRIVATE_PROJECT_ID_SENTINEL', 'PRIVATE_PROJECT_TITLE_SENTINEL', 'PRIVATE_PROJECT_RESULT_SENTINEL']) assert.ok(restoredBundle.includes(sentinel), `${sentinel} is restored`);
  } finally {
    const target = resolve(fixture);
    assert.ok(target.startsWith(resolve(prefix)) && target.startsWith(`${resolve(tmpdir())}${sep}`));
    await rm(target, { recursive: true, force: true });
  }
});
