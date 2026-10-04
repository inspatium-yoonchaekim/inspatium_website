import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'vite';
import { publicContentPlugin } from '../scripts/content-visibility.mjs';

test('built browser files exclude hidden research and papers, their links, draft news and unpublished paper resources, and restore records on publication', async () => {
  const prefix = join(tmpdir(), 'inspatium-visibility-test-');
  const fixture = await mkdtemp(prefix);
  try {
    await mkdir(join(fixture, 'src'));
    await writeFile(join(fixture, 'index.html'), '<html><body><script type="module" src="/src/main.js"></script></body></html>');
    await writeFile(join(fixture, 'src', 'main.js'), 'import content from "./content.json";document.body.textContent=JSON.stringify(content);');
    const content = { site: { name: 'Inspatium' }, projects: [
      { id: 'PRIVATE_PROJECT_ID_SENTINEL', visibility: 'hidden', title: 'PRIVATE_PROJECT_TITLE_SENTINEL', outcome: 'PRIVATE_PROJECT_RESULT_SENTINEL' },
      { id: 'public-project', visibility: 'public', title: 'PUBLIC_PROJECT_SENTINEL', publication: 'HIDDEN_PAPER_ID_SENTINEL' },
      { id: 'legacy-project', title: 'LEGACY_PROJECT_SENTINEL', publication: 'public-paper' },
    ], history: [
      { title: 'HISTORY_ENTRY_SENTINEL', project: 'PRIVATE_PROJECT_ID_SENTINEL' },
      { title: 'PUBLIC_HISTORY_ENTRY_SENTINEL', project: 'public-project' },
    ], news: [
      { id: 'published', visibility: 'public', title: 'PUBLISHED_NEWS_SENTINEL', project: 'PRIVATE_PROJECT_ID_SENTINEL' },
      { id: 'draft', visibility: 'draft', title: 'PRIVATE_DRAFT_SENTINEL' },
      { id: 'missing-visibility', title: 'UNAPPROVED_NEWS_SENTINEL' },
    ], publications: [
      { id: 'private-paper', title: 'APPROVED_PAPER_TITLE', project: 'PRIVATE_PROJECT_ID_SENTINEL', public_release: false, doi: 'PRIVATE_DOI_SENTINEL', url: 'PRIVATE_URL_SENTINEL', code_url: 'PRIVATE_CODE_SENTINEL' },
      { id: 'public-paper', visibility: 'public', title: 'PUBLIC_PAPER_TITLE_SENTINEL', project: 'legacy-project', public_release: true, url: 'PUBLIC_PAPER_URL_SENTINEL' },
      { id: 'legacy-paper', title: 'LEGACY_PAPER_TITLE_SENTINEL', public_release: true, url: 'LEGACY_PAPER_URL_SENTINEL' },
      { id: 'HIDDEN_PAPER_ID_SENTINEL', visibility: 'hidden', title: 'HIDDEN_PAPER_TITLE_SENTINEL', project: 'public-project', public_release: true, doi: 'HIDDEN_PAPER_DOI_SENTINEL', url: 'HIDDEN_PAPER_URL_SENTINEL', code_url: 'HIDDEN_PAPER_CODE_SENTINEL' },
      { id: 'SECOND_HIDDEN_PAPER_ID_SENTINEL', visibility: 'hidden', title: 'SECOND_HIDDEN_PAPER_TITLE_SENTINEL', public_release: false, doi: 'SECOND_HIDDEN_PAPER_DOI_SENTINEL', url: 'SECOND_HIDDEN_PAPER_URL_SENTINEL', code_url: 'SECOND_HIDDEN_PAPER_CODE_SENTINEL' },
    ] };
    const buildBundle = async () => {
      await writeFile(join(fixture, 'src', 'content.json'), JSON.stringify(content));
      await build({ root: fixture, configFile: false, plugins: [publicContentPlugin()], build: { modulePreload: false }, logLevel: 'silent' });
      const assetsDir = join(fixture, 'dist', 'assets');
      const bundle = (await Promise.all((await readdir(assetsDir)).map(file => readFile(join(assetsDir, file), 'utf8')))).join('\n');
      const browser = { document: { body: {} } };
      runInNewContext(bundle, browser);
      return { bundle, rendered: JSON.parse(browser.document.body.textContent) };
    };
    const { bundle, rendered } = await buildBundle();
    for (const sentinel of ['PUBLISHED_NEWS_SENTINEL', 'APPROVED_PAPER_TITLE', 'PUBLIC_PAPER_TITLE_SENTINEL', 'PUBLIC_PAPER_URL_SENTINEL', 'LEGACY_PAPER_TITLE_SENTINEL', 'LEGACY_PAPER_URL_SENTINEL', 'PUBLIC_PROJECT_SENTINEL', 'LEGACY_PROJECT_SENTINEL', 'HISTORY_ENTRY_SENTINEL', 'PUBLIC_HISTORY_ENTRY_SENTINEL', 'public-project']) assert.ok(bundle.includes(sentinel), `${sentinel} remains public`);
    const hiddenPaperSentinels = ['HIDDEN_PAPER_ID_SENTINEL', 'HIDDEN_PAPER_TITLE_SENTINEL', 'HIDDEN_PAPER_DOI_SENTINEL', 'HIDDEN_PAPER_URL_SENTINEL', 'HIDDEN_PAPER_CODE_SENTINEL'];
    for (const sentinel of ['PRIVATE_PROJECT_ID_SENTINEL', 'PRIVATE_PROJECT_TITLE_SENTINEL', 'PRIVATE_PROJECT_RESULT_SENTINEL', 'PRIVATE_DRAFT_SENTINEL', 'UNAPPROVED_NEWS_SENTINEL', 'PRIVATE_DOI_SENTINEL', 'PRIVATE_URL_SENTINEL', 'PRIVATE_CODE_SENTINEL', ...hiddenPaperSentinels, ...hiddenPaperSentinels.map(sentinel => `SECOND_${sentinel}`)]) assert.ok(!bundle.includes(sentinel), `${sentinel} stays private`);
    assert.equal(rendered.projects.find(project => project.id === 'public-project').publication, null);
    assert.equal(rendered.projects.find(project => project.id === 'legacy-project').publication, 'public-paper');
    assert.equal(rendered.publications.find(paper => paper.id === 'public-paper').project, 'legacy-project');
    assert.deepEqual(JSON.parse(await readFile(join(fixture, 'src', 'content.json'), 'utf8')), content, 'source records and links are preserved');

    content.projects[0].visibility = 'public';
    content.publications[3].visibility = 'public';
    const { bundle: restoredBundle, rendered: restored } = await buildBundle();
    for (const sentinel of ['PRIVATE_PROJECT_ID_SENTINEL', 'PRIVATE_PROJECT_TITLE_SENTINEL', 'PRIVATE_PROJECT_RESULT_SENTINEL', ...hiddenPaperSentinels]) assert.ok(restoredBundle.includes(sentinel), `${sentinel} is restored`);
    assert.equal(restored.projects.find(project => project.id === 'public-project').publication, 'HIDDEN_PAPER_ID_SENTINEL');
    assert.equal(restored.publications.find(paper => paper.id === 'HIDDEN_PAPER_ID_SENTINEL').project, 'public-project');
    assert.equal(restored.publications.find(paper => paper.id === 'private-paper').project, 'PRIVATE_PROJECT_ID_SENTINEL');
    for (const sentinel of ['PRIVATE_DOI_SENTINEL', 'PRIVATE_URL_SENTINEL', 'PRIVATE_CODE_SENTINEL', 'PRIVATE_DRAFT_SENTINEL', 'UNAPPROVED_NEWS_SENTINEL']) assert.ok(!restoredBundle.includes(sentinel), `${sentinel} remains private after restoration`);
    assert.ok(!restored.publications.some(paper => paper.id === 'SECOND_HIDDEN_PAPER_ID_SENTINEL'), 'other hidden paper stays private');
  } finally {
    const target = resolve(fixture);
    assert.ok(target.startsWith(resolve(prefix)) && target.startsWith(`${resolve(tmpdir())}${sep}`));
    await rm(target, { recursive: true, force: true });
  }
});
