import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtemp, mkdir, rm, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { createStaticServer } from './static-server.mjs';

let server;
let temporaryDir;
let port;
const indexContent = '<!doctype html><title>Inspatium</title>';
const fontContent = Buffer.from([0x77, 0x4f, 0x46, 0x32, 0x00, 0xff]);
const imageContent = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0xff]);

before(async () => {
  temporaryDir = await mkdtemp(join(tmpdir(), 'inspatium-server-'));
  const distDir = join(temporaryDir, 'dist');
  await mkdir(join(distDir, 'assets'), { recursive: true });
  await writeFile(join(distDir, 'index.html'), indexContent);
  await writeFile(join(distDir, 'assets', 'app.js'), 'console.log("Inspatium");');
  await writeFile(join(distDir, 'assets', 'app.css'), 'body { color: #102737; }');
  await writeFile(join(distDir, 'assets', 'font.woff2'), fontContent);
  await writeFile(join(distDir, 'assets', 'hero.webp'), imageContent);
  await writeFile(join(temporaryDir, 'private.txt'), 'private data');
  await symlink(temporaryDir, join(distDir, 'outside'), 'junction');
  server = createStaticServer({ distDir });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (temporaryDir) {
    // Verify the exact temporary target before recursively removing test fixtures.
    assert.equal(dirname(resolve(temporaryDir)), resolve(tmpdir()));
    assert.match(basename(temporaryDir), /^inspatium-server-/u);
    await rm(temporaryDir, { recursive: true, force: true });
  }
});

function call(path, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => { chunks.push(chunk); });
      res.on('end', () => {
        const bytes = Buffer.concat(chunks);
        resolve({ status: res.statusCode, headers: res.headers, body: bytes.toString('utf8'), bytes });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

test('serves the React entry and client routes, including a query string', async () => {
  for (const path of ['/', '/company', '/technology/?lang=en']) {
    const response = await call(path, { headers: { accept: 'text/html' } });
    assert.equal(response.status, 200);
    assert.equal(response.body, indexContent);
    assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
  }
});

test('serves only known demo index.html aliases as navigation, including HEAD', async () => {
  for (const locale of ['ko', 'en']) {
    for (const page of ['', 'about', 'philosophy', 'greeting', 'history', 'research', 'publications', 'team', 'join', 'news', 'contact', 'research/acoustic-optimization', 'research/few-shot-inverse-design', 'research/embedded-physical-ai', 'research/holography-hardware', 'publications/hat-2026', 'team/sungjun-choi', 'team/yoonchae-kim', 'team/yoonseo-gu', 'team/woojin-an']) {
      const path = `/${locale}${page ? `/${page}` : ''}/index.html?source=demo`;
      const response = await call(path, { headers: { accept: 'text/html' } });
      assert.equal(response.status, 200, path);
      assert.equal(response.body, indexContent, path);
      assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
    }
  }
  const head = await call('/en/research/acoustic-optimization/index.html', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.equal(Number(head.headers['content-length']), Buffer.byteLength(indexContent));
  for (const path of ['/ko/missing/index.html', '/ko/research/missing/index.html', '/en/assets/index.html', '/fr/index.html', '/assets/index.html', '/ko/index.js', '/en/research/acoustic-optimization/app.js']) {
    assert.equal((await call(path, { headers: { accept: 'text/html' } })).status, 404, path);
  }
  assert.equal((await call('/ko/index.html', { headers: { accept: 'application/json' } })).status, 404);
});

test('serves JavaScript with correct MIME type; missing assets and APIs return 404', async () => {
  const asset = await call('/assets/app.js');
  assert.equal(asset.status, 200);
  assert.equal(asset.headers['content-type'], 'text/javascript; charset=utf-8');
  for (const path of ['/assets/missing.js', '/assets/missing', '/missing.png', '/api/unknown']) {
    assert.equal((await call(path)).status, 404, path);
  }
  assert.equal((await call('/unknown', { headers: { accept: 'application/json' } })).status, 404);
});

test('returns exact CSS, font, and image bytes with their MIME types', async () => {
  for (const [path, type, content] of [
    ['/assets/app.css', 'text/css; charset=utf-8', Buffer.from('body { color: #102737; }')],
    ['/assets/font.woff2', 'font/woff2', fontContent],
    ['/assets/hero.webp', 'image/webp', imageContent],
  ]) {
    const response = await call(path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers['content-type'], type, path);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(Number(response.headers['content-length']), content.byteLength);
    assert.deepEqual(response.bytes, content, path);
  }
  for (const path of ['/assets/missing.css', '/assets/missing.woff2', '/assets/missing.webp']) {
    assert.equal((await call(path)).status, 404, path);
  }
});

test('HEAD returns headers without a body and unsupported methods return 405', async () => {
  const head = await call('/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.ok(Number(head.headers['content-length']) > 0);
  const rejected = await call('/', { method: 'POST' });
  assert.equal(rejected.status, 405);
  assert.equal(rejected.headers.allow, 'GET, HEAD');
});

test('health endpoint returns JSON with no caching', async () => {
  const response = await call('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), { status: 'ok', service: 'inspatium-web' });
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('rejects encoded traversal, Windows separators, and malformed paths', async () => {
  for (const path of ['/%2e%2e%2fprivate.txt', '/%5c..%5cprivate.txt', '/%00', '/%zz', '/C%3a/private.txt']) {
    const response = await call(path);
    assert.ok([400, 403].includes(response.status), `${path}: ${response.status}`);
    assert.doesNotMatch(response.body, /private data/);
  }
});

test('cannot read files outside dist through a symlink or junction', async () => {
  const response = await call('/outside/private.txt');
  assert.equal(response.status, 404);
  assert.doesNotMatch(response.body, /private data/);
});
