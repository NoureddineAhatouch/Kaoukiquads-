const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const port = Number(process.env.PORT || 3000);
const root = __dirname;
const dataDir = path.join(root, 'data');
const uploadDir = path.join(root, 'uploads');
const contentFile = path.join(dataDir, 'content.json');
const authFile = path.join(dataDir, 'auth.json');
[dataDir, uploadDir].forEach((d) => fs.mkdirSync(d, { recursive: true }));

const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon' };
const compressible = new Set(['.html', '.css', '.js', '.json', '.svg']);
const blockedFiles = new Set(['server.js', 'package.json', 'TODO.md', 'app.config.ts', 'manus-routes.json']);
const blockedDirs = new Set(['data', 'node_modules']);

/* ---------- Auth: ADMIN_PASSWORD env var, or password saved from the admin page ---------- */
const hash = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString('hex');
function checkPassword(pw) {
  let salt, expected;
  try { ({ salt, hash: expected } = JSON.parse(fs.readFileSync(authFile, 'utf8'))); } catch {}
  if (!expected) { salt = 'kaouki'; expected = hash(process.env.ADMIN_PASSWORD || 'changeme', salt); }
  const a = Buffer.from(hash(pw, salt)), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
if (!process.env.ADMIN_PASSWORD && !fs.existsSync(authFile)) console.warn('⚠ Mot de passe admin par défaut: "changeme" — changez-le depuis /admin.html ou définissez ADMIN_PASSWORD.');
const sessions = new Map();
const attempts = new Map();
const newToken = () => { const t = crypto.randomBytes(32).toString('hex'); sessions.set(t, Date.now() + 12 * 3600e3); return t; };
const isAuthed = (req) => { const t = (req.headers.authorization || '').replace('Bearer ', ''); const exp = sessions.get(t); if (!exp || exp < Date.now()) { sessions.delete(t); return false; } return true; };

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };

async function handleApi(req, res, pathname) {
  try {
    if (pathname === '/api/content' && req.method === 'GET') {
      let data = '{}'; try { data = fs.readFileSync(contentFile, 'utf8'); } catch {}
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(data);
    }
    if (pathname === '/api/login' && req.method === 'POST') {
      const ip = req.socket.remoteAddress, rec = attempts.get(ip) || { n: 0, t: Date.now() };
      if (Date.now() - rec.t > 15 * 60e3) { rec.n = 0; rec.t = Date.now(); }
      if (rec.n >= 8) return send(res, 429, { error: 'Trop de tentatives, réessayez plus tard.' });
      const { password } = JSON.parse(await readBody(req, 2e3) || '{}');
      if (!checkPassword(password || '')) { rec.n++; attempts.set(ip, rec); return send(res, 401, { error: 'Mot de passe incorrect.' }); }
      attempts.delete(ip); return send(res, 200, { token: newToken() });
    }
    if (!isAuthed(req)) return send(res, 401, { error: 'Non autorisé.' });
    if (pathname === '/api/content' && req.method === 'PUT') {
      const body = await readBody(req, 1e6); JSON.parse(body);
      if (fs.existsSync(contentFile)) fs.copyFileSync(contentFile, path.join(dataDir, 'content.backup.json'));
      fs.writeFileSync(contentFile, body); return send(res, 200, { ok: true });
    }
    if (pathname === '/api/content' && req.method === 'DELETE') {
      if (fs.existsSync(contentFile)) fs.copyFileSync(contentFile, path.join(dataDir, 'content.backup.json'));
      fs.rmSync(contentFile, { force: true }); return send(res, 200, { ok: true });
    }
    if (pathname === '/api/upload' && req.method === 'POST') {
      const { data } = JSON.parse(await readBody(req, 9e6));
      const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(data || '');
      if (!m) return send(res, 400, { error: 'Format non pris en charge (JPG, PNG, WEBP).' });
      const name = crypto.randomBytes(8).toString('hex') + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]);
      fs.writeFileSync(path.join(uploadDir, name), Buffer.from(m[2], 'base64')); return send(res, 200, { url: 'uploads/' + name });
    }
    if (pathname === '/api/password' && req.method === 'POST') {
      const { password } = JSON.parse(await readBody(req, 2e3));
      if (!password || password.length < 8) return send(res, 400, { error: '8 caractères minimum.' });
      const salt = crypto.randomBytes(8).toString('hex');
      fs.writeFileSync(authFile, JSON.stringify({ salt, hash: hash(password, salt) })); sessions.clear(); return send(res, 200, { token: newToken() });
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) { send(res, 400, { error: 'Requête invalide.' }); }
}

const server = http.createServer((req, res) => {
  let requested;
  try { requested = decodeURIComponent((req.url || '/').split('?')[0]); }
  catch { res.writeHead(400); res.end('Bad request'); return; }
  if (requested.startsWith('/api/')) { handleApi(req, res, requested); return; }

  const relative = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');
  const filePath = path.resolve(root, relative);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (blockedFiles.has(path.basename(filePath)) || blockedDirs.has(relative.split('/')[0])) { res.writeHead(404); res.end('Not found'); return; }

  fs.readFile(filePath, (error, data) => {
    if (error) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const isAsset = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'].includes(ext);
    const headers = { 'Content-Type': mime[ext] || 'application/octet-stream', 'Cache-Control': isAsset ? 'public, max-age=604800' : 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
    if (path.basename(filePath) === 'admin.html') headers['X-Robots-Tag'] = 'noindex, nofollow';
    if (compressible.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      headers['Content-Encoding'] = 'gzip'; headers['Vary'] = 'Accept-Encoding';
      res.writeHead(200, headers); res.end(zlib.gzipSync(data)); return;
    }
    res.writeHead(200, headers); res.end(data);
  });
});
server.listen(port, '0.0.0.0', () => console.log(`Kaouki Quad listening on ${port}`));
