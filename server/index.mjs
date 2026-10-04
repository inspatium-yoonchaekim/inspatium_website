import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from './static-server.mjs';

const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer from 1 to 65535.');
  process.exit(1);
}

try {
  await access(new URL('../dist/index.html', import.meta.url));
} catch {
  console.error('빌드 파일이 없습니다. 먼저 npm run build를 실행하세요.');
  process.exit(1);
}

const server = createStaticServer({ distDir });
server.on('error', (error) => {
  console.error(`서버를 시작할 수 없습니다: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  const address = host.includes(':') ? `[${host}]` : host;
  console.log(`Inspatium website: http://${address}:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
