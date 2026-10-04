import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { build } from 'vite';
import { publicContentPlugin } from '../scripts/content-visibility.mjs';

test('built browser files exclude draft news and unpublished paper links', async () => {
  const prefix = join(tmpdir(), 'inspatium-visibility-test-');
  const fixture = await mkdtemp(prefix);
  try {
    await mkdir(join(fixture, 'src'));
    await writeFile(join(fixture, 'index.html'), '<html><body><script type="module" src="/src/main.js"></script></body></html>');
    await writeFile(join(fixture, 'src', 'main.js'), 'import content from "./content.json";document.body.textContent=JSON.stringify(content);');
    await writeFile(join(fixture, 'src', 'content.json'), JSON.stringify({ site: { name: 'Inspatium' }, news: [
      { id: 'published', visibility: 'public', title: 'PUBLISHED_NEWS_SENTINEL' },
      { id: 'draft', visibility: 'draft', title: 'PRIVATE_DRAFT_SENTINEL' },
      { id: 'missing-visibility', title: 'UNAPPROVED_NEWS_SENTINEL' },
    ], publications: [
      { id: 'private-paper', title: 'APPROVED_PAPER_TITLE', public_release: false, doi: 'PRIVATE_DOI_SENTINEL', url: 'PRIVATE_URL_SENTINEL', code_url: 'PRIVATE_CODE_SENTINEL' },
      { id: 'public-paper', public_release: true, url: 'PUBLIC_PAPER_URL_SENTINEL' },
    ] }));
    await build({ root: fixture, configFile: false, plugins: [publicContentPlugin()], logLevel: 'silent' });
    const assetsDir = join(fixture, 'dist', 'assets');
    const builtFiles = await Promise.all((await readdir(assetsDir)).map(file => readFile(join(assetsDir, file), 'utf8')));
    const bundle = builtFiles.join('\n');
    for (const sentinel of ['PUBLISHED_NEWS_SENTINEL', 'APPROVED_PAPER_TITLE', 'PUBLIC_PAPER_URL_SENTINEL']) assert.ok(bundle.includes(sentinel));
    for (const sentinel of ['PRIVATE_DRAFT_SENTINEL', 'UNAPPROVED_NEWS_SENTINEL', 'PRIVATE_DOI_SENTINEL', 'PRIVATE_URL_SENTINEL', 'PRIVATE_CODE_SENTINEL']) assert.ok(!bundle.includes(sentinel));
  } finally {
    const target = resolve(fixture);
    assert.ok(target.startsWith(resolve(prefix)) && target.startsWith(`${resolve(tmpdir())}${sep}`));
    await rm(target, { recursive: true, force: true });
  }
});
