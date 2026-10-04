import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const CONTENT_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.avif', 'image/avif'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.pdf', 'application/pdf'],
]);

// Preserve the static demo's URLs without treating every missing .html file as a page.
const LEGACY_PAGE_PATHS = [
  '', 'philosophy', 'greeting', 'about', 'history', 'research', 'publications',
  'team', 'join', 'news', 'contact',
  'research/acoustic-optimization', 'research/few-shot-inverse-design',
  'research/embedded-physical-ai', 'research/holography-hardware',
  'publications/hat-2026',
  'team/sungjun-choi', 'team/yoonchae-kim', 'team/yoonseo-gu', 'team/woojin-an',
];
const LEGACY_NAVIGATION_ROUTES = new Set(['ko', 'en'].flatMap(locale =>
  LEGACY_PAGE_PATHS.map(page => `/${locale}${page ? `/${page}` : ''}/index.html`),
));

function isWithin(root, candidate) {
  const difference = relative(root, candidate);
  return difference !== '..' && !difference.startsWith(`..${sep}`) && !isAbsolute(difference);
}

function reply(req, res, status, body, extraHeaders = {}) {
  const buffer = Buffer.from(body);
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': buffer.byteLength,
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(req.method === 'HEAD' ? undefined : buffer);
}

async function findFile(root, candidate) {
  try {
    const resolvedFile = await realpath(candidate);
    if (!isWithin(root, resolvedFile)) return null;
    const info = await stat(resolvedFile);
    return info.isFile() ? resolvedFile : null;
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EACCES', 'EINVAL'].includes(error.code)) return null;
    throw error;
  }
}

/** Serve the built React app, with a navigation-only SPA fallback. */
export function createStaticServer({ distDir }) {
  const distPath = resolve(distDir);

  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    if (!['GET', 'HEAD'].includes(req.method)) {
      reply(req, res, 405, 'Method Not Allowed\n', { Allow: 'GET, HEAD' });
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
      if (!pathname.startsWith('/') || /[\\\u0000:]/u.test(pathname)) {
        reply(req, res, 400, 'Bad Request\n');
        return;
      }
    } catch {
      reply(req, res, 400, 'Bad Request\n');
      return;
    }

    if (pathname === '/api/health') {
      reply(req, res, 200, JSON.stringify({ status: 'ok', service: 'inspatium-web' }), {
        'Content-Type': 'application/json; charset=utf-8',
      });
      return;
    }

    const candidate = resolve(distPath, `.${pathname}`);
    if (!isWithin(distPath, candidate)) {
      reply(req, res, 403, 'Forbidden\n');
      return;
    }

    try {
      const root = await realpath(distPath);
      let file = await findFile(root, pathname === '/' ? join(root, 'index.html') : candidate);
      if (!file) {
        const acceptsHtml = !req.headers.accept || req.headers.accept.includes('text/html') || req.headers.accept.includes('*/*');
        const isNavigation = LEGACY_NAVIGATION_ROUTES.has(pathname) ||
          (!extname(pathname) && !/^\/(?:assets|api)(?:\/|$)/u.test(pathname));
        if (acceptsHtml && isNavigation) file = await findFile(root, join(root, 'index.html'));
      }

      if (!file) {
        reply(req, res, 404, 'Not Found\n');
        return;
      }

      const content = await readFile(file);
      const extension = extname(file).toLowerCase();
      res.writeHead(200, {
        'Content-Type': CONTENT_TYPES.get(extension) ?? 'application/octet-stream',
        'Content-Length': content.byteLength,
        'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=3600',
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        reply(req, res, 503, 'Website build not found. Run npm run build first.\n');
      } else {
        console.error('Static server request failed:', error.message);
        reply(req, res, 500, 'Internal Server Error\n');
      }
    }
  });
}
