// Сборка интерфейса: склеивает и минифицирует src/css/*.css и src/js/*.js в два файла с хешем в имени
// и пересобирает public/index.html из src/index.html.
// Запуск: npm install --no-save esbuild && npm run build:assets
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let esbuild;
try { esbuild = require('esbuild'); } catch { esbuild = require('/opt/npm-tools/node_modules/esbuild'); }

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(root, 'src'), PUB = path.join(root, 'public');
const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
const TOK = /<link[^>]*rel="stylesheet"[^>]*>|<style[^>]*>[\s\S]*?<\/style>|<script[^>]*src="[^"]*"[^>]*><\/script>|<script(?![^>]*src)[^>]*>[\s\S]*?<\/script>/g;
const toks = [...html.matchAll(TOK)].map(m => ({ text: m[0], at: m.index }));
const firstCssLink = toks.findIndex(t => t.text.startsWith('<link'));
const attr = (s, a) => (s.match(new RegExp(a + '="([^"]*)"')) || [])[1];
const read = (kind, href) => fs.readFileSync(path.join(SRC, kind, path.basename(href)), 'utf8');

const css = [], js = []; const remove = new Set(); let cssAt = -1, jsAt = -1;
toks.forEach((t, i) => {
  const s = t.text;
  if (s.startsWith('<link')) { const h = attr(s, 'href'); if (h && h.startsWith('/')) { css.push(read('css', h)); if (cssAt < 0) cssAt = i; else remove.add(i); } }
  else if (s.startsWith('<style')) { if (i < firstCssLink) { css.push(s.replace(/^<style[^>]*>|<\/style>$/g, '')); remove.add(i); } }
  else if (s.startsWith('<script') && /src="/.test(s.slice(0, 120))) { const h = attr(s, 'src'); if (h && h.startsWith('/')) { js.push(read('js', h)); if (jsAt < 0) jsAt = i; else remove.add(i); } }
  else { const body = s.replace(/^<script[^>]*>|<\/script>$/g, ''); if (body.length > 1000) { js.push(body); if (jsAt < 0) jsAt = i; else remove.add(i); } }
});
if (cssAt < 0 || jsAt < 0) throw new Error('Не найдены подключения css или js в src/index.html');
// css, который шёл до первой ссылки, подключаем первым (он был добавлен в css раньше ссылок)
const cssOut = esbuild.transformSync(css.join('\n'), { loader: 'css', minify: true, target: ['chrome87', 'safari14'], legalComments: 'none' }).code;
const jsOut = esbuild.transformSync(js.join('\n;\n'), { minify: true, target: 'es2020', legalComments: 'none' }).code;
const h8 = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 8);
const cssName = `app.${h8(cssOut)}.css`, jsName = `app.${h8(jsOut)}.js`;
for (const f of fs.readdirSync(PUB)) if (/^app\.[0-9a-f]{8}\.(css|js)$/.test(f)) fs.unlinkSync(path.join(PUB, f));
fs.writeFileSync(path.join(PUB, cssName), cssOut); fs.writeFileSync(path.join(PUB, jsName), jsOut);
let out = ''; let last = 0;
toks.forEach((t, i) => {
  out += html.slice(last, t.at); last = t.at + t.text.length;
  if (i === cssAt) out += `<link rel="stylesheet" href="/${cssName}">`;
  else if (i === jsAt) out += `<script src="/${jsName}"></script>`;
  else if (!remove.has(i)) out += t.text;
});
out += html.slice(last);
out = out.replace('<title>', '<link rel="preconnect" href="https://telegram.org"><title>');
out = out.replace('<!doctype html>', '<!doctype html><!-- ФАЙЛ СОБРАН СКРИПТОМ scripts/build.mjs, правь src/index.html -->');
fs.writeFileSync(path.join(PUB, 'index.html'), out);
const size = s => `${(Buffer.byteLength(s) / 1024).toFixed(1)} КБ (gzip ${(zlib.gzipSync(s).length / 1024).toFixed(1)}, brotli ${(zlib.brotliCompressSync(s).length / 1024).toFixed(1)})`;
console.log(`css: ${css.length} частей -> ${cssName}  ${size(cssOut)}\njs:  ${js.length} частей -> ${jsName}  ${size(jsOut)}\nindex.html: ${size(out)}`);
