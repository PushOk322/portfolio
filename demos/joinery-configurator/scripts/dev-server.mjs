/**
 * Static file server for local development.
 *
 * Replaces `python -m http.server`, for two reasons: it honours $PORT so two
 * sessions can run side by side, and it sends no-store, so an edited ES module
 * is actually re-fetched instead of being served from the browser's cache.
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8099;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.hdr': 'image/vnd.radiance',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
  // normalize() collapses ../ so a crafted path cannot escape the project.
  const target = join(ROOT, normalize(url).replace(/^(\.\.[/\\])+/, ''));
  const path = target.endsWith('/') || target === ROOT ? join(target, 'index.html') : target;

  try {
    const info = await stat(path);
    const file = info.isDirectory() ? join(path, 'index.html') : path;

    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-store, must-revalidate',
    });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404');
  }
}).listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
