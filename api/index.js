// ARCHESZ STORE API (Vercel serverless function + Upstash Redis).  Env vars (Vercel > Settings > Environment Variables):
//   KV_REST_API_URL + KV_REST_API_TOKEN   (added automatically when you connect Upstash Redis / Vercel KV)
//   ADMIN_PASSWORD  (admin panel password)      REFERRAL_CODE (default 3142020)
const crypto = require('crypto');
const URL_ = process.env.archesz_KV_REST_API_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL, TOK_ = process.env.archesz_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const REF = process.env.REFERRAL_CODE || '3142020', ADMIN = process.env.ADMIN_PASSWORD || 'archesz';
// Prices live HERE (server) so users cannot cheat. Keep in sync with PRODUCTS in SCRIPTJS/script.js
const PLANS = {
  'archesz-v1': { name: 'ARCHESZ INJECTOR', plans: [['01 DAYS', 50], ['03 DAYS', 100], ['07 DAYS', 200], ['30 DAYS', 350], ['PERMANENT', 500]] },
  'archesz-v2': { name: 'ARCHESZ INTERNAL', plans: [['01 DAYS', 50], ['03 DAYS', 100], ['07 DAYS', 200], ['30 DAYS', 350], ['PERMANENT', 1,500]] },
};

const rd = async (...c) => { const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOK_ }, body: JSON.stringify(c) }); const j = await r.json(); if (j.error) throw new Error(j.error); return j.result; };
const hget = async (h, k) => { const v = await rd('HGET', h, k); return v ? JSON.parse(v) : null; };
const hset = (h, k, v) => rd('HSET', h, k, JSON.stringify(v));
const hall = async (h) => { const a = (await rd('HGETALL', h)) || [], o = []; for (let i = 1; i < a.length; i += 2) o.push(JSON.parse(a[i])); return o; };
const rid = (n = 3) => crypto.randomBytes(n).toString('hex').toUpperCase();
const bad = (m, s = 400) => { const e = new Error(m); e.status = s; throw e; };
const hash = (p, s) => crypto.scryptSync(p, s, 32).toString('hex');
const saveImg = async (d) => { if (!d) return ''; if (!/^data:image\/(jpeg|png);base64,/.test(d) || d.length > 900000) bad('Bad or too large image.'); const id = rid(12).toLowerCase(); await rd('HSET', 'img', id, d); return '/api?img=' + id; };
const delImg = (u) => (u && u.startsWith('/api?img=') ? rd('HDEL', 'img', u.slice(9)) : null);
const who = async (b) => { const e = b.t && (await rd('GET', 's:' + b.t)); if (!e) bad('Please login again.', 401); return e; };
const adm = async (b) => { if (!b.at || !(await rd('GET', 'a:' + b.at))) bad('Admin login required.', 401); };
const byTs = (x, y) => y.ts - x.ts;
const mkSession = async (email) => { const t = crypto.randomBytes(24).toString('hex'); await rd('SET', 's:' + t, email, 'EX', 2592000); return t; };

const R = {
  async reg(b) {
    const email = String(b.email || '').trim().toLowerCase(), pass = String(b.pass || '');
    if (!/^[^\s@]+@gmail\.com$/.test(email)) bad('Use a valid Gmail (example@gmail.com).');
    if (pass.length < 8) bad('Password must be at least 8 characters.');
    if (String(b.ref || '').trim() !== REF) bad('Wrong referral code.');
    if (await hget('users', email)) bad('This Gmail is already registered. Please login.');
    const salt = rid(8); await hset('users', email, { email, salt, hash: hash(pass, salt), coins: 0, created: Date.now() });
    return { token: await mkSession(email) };
  },
  async login(b) {
    const email = String(b.email || '').trim().toLowerCase(), u = await hget('users', email);
    if (!u || hash(String(b.pass || ''), u.salt) !== u.hash) bad('Wrong Gmail or password.');
    return { token: await mkSession(email) };
  },
  async prod() { return { img: (await rd('HGET', 'cfg', 'prodImg')) || '' }; },
  async fbs() { const f = (await hall('fb')).sort(byTs); return { fbs: f, avg: f.length ? f.reduce((a, x) => a + x.stars, 0) / f.length : 0 }; },
  async me(b) {
    const e = await who(b), u = await hget('users', e); if (!u) bad('Account not found.', 401);
    await rd('HSET', 'presence', e, Date.now());
    const [o, p, c] = await Promise.all([hall('orders'), hall('purchases'), hall('chat')]);
    return { email: e, coins: u.coins, orders: o.filter((x) => x.email === e).sort(byTs), purchases: p.filter((x) => x.email === e).sort(byTs), unread: c.filter((m) => m.email === e && m.from === 'admin' && !m.read).length };
  },
  async ping(b) { await rd('HSET', 'presence', await who(b), Date.now()); return {}; },
  async order(b) {
    const e = await who(b), pts = parseInt(b.pts) || 0;
    if (pts < 50 || pts > 100000) bad('Minimum top-up is ₱50.');
    if (!b.receipt) bad('Please upload your payment screenshot.');
    const o = { id: 'ARC-' + rid(), email: e, pts, amount: pts, status: 'pending', ts: Date.now(), name: String(b.name || 'receipt.jpg').slice(0, 80), receipt: await saveImg(b.receipt), seen: false };
    await hset('orders', o.id, o); return { id: o.id };
  },
  async seen(b) { const e = await who(b); for (const o of await hall('orders')) if (o.email === e && o.status !== 'pending' && !o.seen) { o.seen = true; await hset('orders', o.id, o); } return {}; },
  async buy(b) {
    const e = await who(b), p = PLANS[b.pid], pl = p && p.plans[+b.i]; if (!pl) bad('Invalid plan.');
    const u = await hget('users', e); if (u.coins < pl[1]) bad(`Not enough wallet balance - you need ₱${pl[1] - u.coins} more.`);
    u.coins -= pl[1]; await hset('users', e, u);
    const pid = 'PRD-' + rid(); await hset('purchases', pid, { id: pid, email: e, product: p.name, plan: pl[0], pts: pl[1], ts: Date.now() });
    return { coins: u.coins, id: pid, plan: pl[0], pts: pl[1] };
  },
  async chat(b) {
    const e = await who(b), all = (await hall('chat')).filter((m) => m.email === e).sort((x, y) => x.ts - y.ts);
    for (const m of all) if (m.from === 'admin' && !m.read) { m.read = true; await hset('chat', m.id, m); }
    return { msgs: all };
  },
  async csend(b) {
    const e = await who(b); let text = String(b.text || '').slice(0, 600), share = null;
    if (b.share) { // "SHARE APK TO ADMIN": built from the buyer's REAL purchase, never from client-typed values
      const pu = await hget('purchases', String(b.share));
      if (!pu || pu.email !== e) bad('Order not found.');
      share = { pid: pu.id, email: e, product: pu.product, plan: pu.plan, payment: 'GCASH', status: 'DONE', icon: /^https?:\/\/[^\s"'<>]{4,200}$/.test(b.icon || '') ? b.icon : '' };
      text = text || `USER: ${e} • APK: ${pu.product} • PAYMENT: GCASH VIA - DONE ✓ • DURATION: ${pu.plan}`;
    }
    if (!text && !b.img) bad('Type a message or attach an image.');
    const m = { id: 'M' + rid(5), email: e, from: 'user', text, img: await saveImg(b.img), share, orderId: String(b.orderId || '').slice(0, 20), orderTime: String(b.orderTime || '').slice(0, 40), ts: Date.now(), read: false };
    await hset('chat', m.id, m); return {};
  },
  async fbsend(b) {
    const e = await who(b), stars = Math.min(5, Math.max(1, parseInt(b.stars) || 5)), text = String(b.text || '').trim().slice(0, 400); if (!text) bad('Write your feedback first.');
    const f = { id: 'FB-' + rid(), email: e, stars, text, img: await saveImg(b.img), ts: Date.now() };
    await hset('fb', f.id, f); return {};
  },
  // ---------------- admin ----------------
  async adm_login(b) { if (String(b.pass || '') !== ADMIN) bad('Wrong passcode.'); const t = crypto.randomBytes(24).toString('hex'); await rd('SET', 'a:' + t, '1', 'EX', 43200); return { at: t }; },
  async adm_all(b) {
    await adm(b);
    const [o, p, u, f, c, pa, img] = await Promise.all([hall('orders'), hall('purchases'), hall('users'), hall('fb'), hall('chat'), rd('HGETALL', 'presence'), rd('HGET', 'cfg', 'prodImg')]);
    const pres = {}; for (let i = 0; i < (pa || []).length; i += 2) pres[pa[i]] = +pa[i + 1];
    const th = {}; c.sort(byTs).forEach((m) => { const t = (th[m.email] = th[m.email] || { email: m.email, last: m, unread: 0 }); if (m.from === 'user' && !m.read) t.unread++; });
    return { orders: o.sort(byTs), purchases: p.sort(byTs), fbs: f.sort(byTs), prodImg: img || '', threads: Object.values(th).sort((x, y) => y.last.ts - x.last.ts),
      users: u.map((x) => ({ email: x.email, coins: x.coins, created: x.created, online: Date.now() - (pres[x.email] || 0) < 60000 })).sort((x, y) => y.created - x.created) };
  },
  async adm_approve(b) {
    await adm(b); const o = await hget('orders', b.id); if (!o || o.status !== 'pending') bad('Order is no longer pending.');
    const u = await hget('users', o.email); if (!u) bad('User account not found.');
    u.coins += o.pts; await hset('users', u.email, u); Object.assign(o, { status: 'approved', approvedAt: Date.now(), seen: false }); await hset('orders', o.id, o); return {};
  },
  async adm_cancel(b) { await adm(b); const o = await hget('orders', b.id); if (!o || o.status !== 'pending') bad('Order is no longer pending.'); Object.assign(o, { status: 'cancelled', seen: false }); await hset('orders', o.id, o); return {}; },
  async adm_add(b) {
    await adm(b); const email = String(b.email || '').trim().toLowerCase(), n = parseInt(b.coins) || 0, u = await hget('users', email);
    if (!u) bad('No account with that Gmail.'); if (n < 1 || n > 1000000) bad('Enter an amount to add.');
    u.coins += n; await hset('users', email, u);
    const id = 'ADM-' + rid(); await hset('orders', id, { id, email, pts: n, amount: 0, status: 'approved', manual: true, ts: Date.now(), approvedAt: Date.now(), seen: false }); return { coins: u.coins };
  },
  async adm_chat(b) {
    await adm(b); const all = (await hall('chat')).filter((m) => m.email === b.email).sort((x, y) => x.ts - y.ts);
    for (const m of all) if (m.from === 'user' && !m.read) { m.read = true; await hset('chat', m.id, m); } return { msgs: all };
  },
  async adm_csend(b) {
    await adm(b); const text = String(b.text || '').slice(0, 600); if (!text && !b.img) bad('Empty message.');
    const m = { id: 'M' + rid(5), email: String(b.email), from: 'admin', text, img: await saveImg(b.img), ts: Date.now(), read: false }; await hset('chat', m.id, m); return {};
  },
  async adm_fbdel(b) { await adm(b); const f = await hget('fb', b.id); if (f) { await delImg(f.img); await rd('HDEL', 'fb', b.id); } return {}; },
  async adm_fbimg(b) { await adm(b); const f = await hget('fb', b.id); if (f) { await delImg(f.img); f.img = ''; await hset('fb', f.id, f); } return {}; },
  async adm_setprod(b) { await adm(b); const old = await rd('HGET', 'cfg', 'prodImg'); const u = b.img ? await saveImg(b.img) : ''; await rd('HSET', 'cfg', 'prodImg', u); await delImg(old); return { img: u }; },
};

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const d = req.query && req.query.img && (await rd('HGET', 'img', String(req.query.img).replace(/[^a-f0-9]/g, '')));
      if (!d) return res.status(404).end('Not found');
      const m = /^data:(image\/\w+);base64,(.*)$/.exec(d);
      res.setHeader('Content-Type', m[1]); res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).end(Buffer.from(m[2], 'base64'));
    }
    const b = req.body || {}, fn = R[b.a]; if (!fn) bad('Unknown action.');
    res.status(200).json({ ok: true, ...(await fn(b)) });
  } catch (e) { res.status(e.status || 400).json({ ok: false, err: e.message, code: e.status || 400 }); }
};
