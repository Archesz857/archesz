// ARCHESZ STORE - front-end. Data lives on the server (api/index.js + Upstash Redis).

// Firebase Storage PLACEHOLDER (demo only - paste your own config to enable)
const firebaseConfig = { apiKey: "YOUR_API_KEY", authDomain: "YOUR_PROJECT.firebaseapp.com", storageBucket: "YOUR_PROJECT.appspot.com" };
function uploadReceiptDemo(file, max = 720) {
  // Demo: compress image to a small data-URL so the ADMIN panel can display it.
  // Real version: firebase.storage().ref('receipts/' + file.name).put(file)
  return new Promise((res, rej) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', .6)); };
    img.onerror = rej; img.src = u;
  });
}

// ===== PRODUCTS (edit description / version / plans here) =====
const ASSET = { bg: '/ASSETS/shop-bg.jpg', icon: '/ASSETS/shop-01.png', done: '/ASSETS/done-icon.png', video: '/ASSETS/buy-video.mp4', store: '/ASSETS/store.mp4', gcash: '/ASSETS/gcash.png', logo: '/ASSETS/homepage-icon.png', login: '/ASSETS/login.png' };
const PRODUCTS = [
{
  id: 'archesz-v1', name: 'ARCHESZ INJECTOR', title: 'ARCHESZ INJECTOR', version: 'V1.57', img: '/ASSETS/shop-01.png', platform: 'Android', type: 'MOD APK',
  game: 'CALL OF DUTY ANDROID', banner: '/ASSETS/shot-1.jpg', shots: ['/ASSETS/shot-1.jpg', '/ASSETS/shot-2.jpg', '/ASSETS/shot-3.jpg'],
  tags: ['GARENA', 'LATEST VERSION', 'ARCHESZ V1'],
  short: 'MOD APK TO VIRTUAL APK. PREMIUM MOD EXPERIENCE BUILT WITH PERFORMANCE AND RELIABILITY IN MIND.',
  desc: 'ARCHESZ INJECTOR - MOD APK TO VIRTUAL APK\nANDROID - GARENA\nLATEST VERSION\nCHOOSE YOUR METHOD TO PURCHASE INSTANTLY. ARCHESZ INC.\nAFTER PURCHASE, OPEN DONE BUY TO DOWNLOAD YOUR APK AND SHARE YOUR ORDER TO ADMIN FOR YOUR LICENCE.',
  plans: [['01 DAYS', 50], ['03 DAYS', 100], ['07 DAYS', 200], ['30 DAYS', 350], ['PERMANENT', 100]]
},
{
  id: 'archesz-v2', name: 'ARCHESZ MLBB', title: 'ARCHESZ MLBB', version: 'V58', img: '/ASSETS/shop-02.png', platform: 'Android', type: 'MOD APK',
  game: 'MOBILE LEGENDS ANDROID', banner: '/ASSETS/shot-2.jpg', shots: ['/ASSETS/shot-2.jpg', '/ASSETS/shot-3.jpg', '/ASSETS/shot-1.jpg'],
  tags: ['MLBB', 'LATEST VERSION', 'ARCHESZ V58'],
  short: 'MOD APK TO VIRTUAL APK. SMOOTH, STABLE AND EASY TO INSTALL ON ANDROID.',
  desc: 'ARCHESZ V2 - MOD APK TO VIRTUAL APK\nANDROID - MOBILE LEGENDS\nLATEST VERSION\nCHOOSE YOUR METHOD TO PURCHASE INSTANTLY. ARCHESZ INC.\nAFTER PURCHASE, OPEN DONE BUY TO DOWNLOAD YOUR APK AND SHARE YOUR ORDER TO ADMIN FOR YOUR LICENCE.',
  plans: [['01 DAYS', 50], ['03 DAYS', 100], ['07 DAYS', 200], ['30 DAYS', 350], ['PERMANENT', 1,500]]
}
];
const money = (n) => '₱' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 });
const CONTACT = '@Archeszcom';
// >>> PASTE YOUR MEDIAFIRE LINK HERE (example: https://www.mediafire.com/file/xxxx/ARCHESZ.apk/file)
const APK_LINK = 'https://www.mediafire.com/file/2810vl417npoylb/NO+SKIN+INJECTOR+V1.apk/file';
// Product icon: shows your image (same size as the old icon). Falls back to the font icon if the image is missing.
const pIcon = (p, cls = 'purple-icon') => p.img
  ? `<div class="menu-icon prod-img"><img src="${p.img}" alt="${p.name}" onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'fas ${p.icon}'}))"></div>`
  : `<div class="menu-icon ${cls}"><i class="fas ${p.icon}"></i></div>`;
const prodOf = (name) => PRODUCTS.find((x) => x.name === name) || PRODUCTS[0];

// ===== Server connection =====
const TOK = 'archesz_token', S = { coins: 0, orders: [], purchases: [], email: '', unread: 0 };
async function api(a, d = {}) {
  let j; try { const r = await fetch('/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a, t: localStorage.getItem(TOK) || '', at: sessionStorage.getItem('arc_at') || '', ...d }) }); j = await r.json(); }
  catch { j = { ok: false, err: 'No connection to server.' }; }
  if (j.code === 401 && !d.quiet && document.body.dataset.role !== 'admin') { localStorage.removeItem(TOK); location.href = '/AUTH/login.html'; }
  return j;
}
const loadDB = () => ({ balance: S.coins, history: S.orders, purchases: S.purchases, user: { email: S.email } });
const setCoins = () => { const e = document.getElementById('coinBal'); if (e) e.textContent = S.coins.toLocaleString(); };
async function boot() {
  if (document.body.dataset.role === 'admin' || document.getElementById('authForm')) return;
  const [j, pj] = await Promise.all([api('me'), api('prod', { quiet: true })]);
  if (j.ok) Object.assign(S, { coins: j.coins, orders: j.orders, purchases: j.purchases, email: j.email, unread: j.unread });
}

// ===== SUPPORT CENTER chat =====
const escH = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtTime = (t) => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const shareCard = (s) => `<div class="share-card"><div class="sc-row"><span>USER</span><b class="keep-case">${escH(s.email)}</b></div>
  <div class="sc-row"><span>APK</span><b class="sc-apk"><img src="${escH(s.icon || '/ASSETS/apk-icon.png')}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'fas fa-ghost'}))"> ${escH(s.product)}</b></div>
  <div class="sc-row"><span>PAYMENT</span><b>${escH(s.payment)} VIA - ${escH(s.status)} <i class="fas fa-circle-check sc-ok"></i></b></div>
  <div class="sc-row"><span>DURATION</span><b>${escH(s.plan)}</b></div>
  ${document.body.dataset.role === 'admin' ? `<button class="btn btn-purple full-btn" data-sendlic data-product="${escH(s.product)}" data-plan="${escH(s.plan)}"><i class="fas fa-key"></i> SEND LICENCE TO USER</button>` : ''}</div>`;
const bubble = (m, mine, name) => `<div class="msg ${mine ? 'me' : 'them'}"><div class="msg-name">${escH(name)}</div>${m.text && !m.share ? `<p>${escH(m.text)}</p>` : ''}${m.img ? `<img class="msg-img" data-img src="${m.img}" alt="image">` : ''}${m.orderId ? `<div class="msg-order"><span>ORDER ID: ${escH(m.orderId)}</span><span>ORDER TIME: ${escH(m.orderTime)}</span></div>` : ''}${m.share ? shareCard(m.share) : ''}<small>${fmtTime(m.ts)}</small></div>`;
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
document.addEventListener('click', (e) => { const i = e.target.closest('img[data-img]'); if (i) modal(`<img class="rcpt-full" src="${i.src}"><button class="btn btn-dark full-btn" data-close>Close</button>`); });

const ymd = (t) => { const d = new Date(t), z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}/${z(d.getMonth() + 1)}/${z(d.getDate())}`; };
const fmtDate = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
}
function modal(html, onClose) {
  const b = document.createElement('div'); b.className = 'modal-back'; b.innerHTML = `<div class="modal">${html}</div>`; document.body.appendChild(b);
  requestAnimationFrame(() => b.classList.add('show'));
  const close = () => { b.classList.remove('show'); setTimeout(() => b.remove(), 250); onClose && onClose(); };
  b.addEventListener('click', (e) => { if (e.target === b || e.target.closest('[data-close]')) close(); });
  return { el: b.firstChild, close };
}
function go(url) { document.body.classList.add('leaving'); setTimeout(() => (location.href = url), 220); }
function countUp(el, to, ms = 900) {
  const t0 = performance.now();
  const step = (n) => { const k = Math.min((n - t0) / ms, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e).toLocaleString(); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  setTimeout(() => { el.textContent = Math.round(to).toLocaleString(); }, ms + 150); // fallback (background tabs pause animations)
}
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// (particles / aurora / cursor glow removed on purpose: they made the site laggy)
function initFX() {}

// Button ripple + page transitions + hero tilt
document.addEventListener('click', (e) => {
  const b = e.target.closest('.btn,.mini-btn,.filter-btn,.quick-btns button');
  if (b) {
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement('span');
    s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    b.style.overflow = 'hidden'; b.appendChild(s); setTimeout(() => s.remove(), 600);
  }
  const a = e.target.closest('a[href]');
  if (a && !a.target && !/^(#|http|mailto)/.test(a.getAttribute('href')) && !e.metaKey && !e.ctrlKey) { e.preventDefault(); go(a.href); }
});
addEventListener('pageshow', () => document.body.classList.remove('leaving'));

document.addEventListener('DOMContentLoaded', async () => {
  initFX();
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  await boot();

  // ---- SITE HEADER + SIDEBAR ----
  if (!$('#authForm') && document.body.dataset.role !== 'admin') {
    const ini = (S.email || 'GU').slice(0, 2).toUpperCase();
    const brand = `<a class="sh-brand" href="/HOMEPAGE/index.html"><img src="${ASSET.logo}" alt="" onerror="this.style.display='none'"><span class="sh-name"><b>ARCH<em>ESZ</em></b><small>OFFICIAL</small></span></a>`;
    const hd = document.createElement('header'); hd.className = 'site-header';
    hd.innerHTML = `${brand}<a class="sh-avatar" href="/MYPOINTS/mypoints.html" title="My wallet">${escH(ini)}</a><button class="sh-burger" id="menuBtn" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>`;
    const here = location.pathname.toLowerCase(), links = [['/HOMEPAGE/index.html', 'fa-house', 'HOME'], ['/BROWSESHOP/shop.html', 'fa-store', 'BROWSE CATALOG'], ['/BUYPOINTS/buypoints.html', 'fa-circle-plus', 'ADD FUNDS'], ['/MYPOINTS/mypoints.html', 'fa-wallet', 'MY WALLET'], ['/DONEBUY/donebuy.html', 'fa-circle-check', 'DONE BUY'], ['/SUPPORT/support.html', 'fa-headset', 'SUPPORT CENTER'], ['/FEEDBACK/feedback.html', 'fa-star', 'FEEDBACKS']];
    const ov = document.createElement('div'); ov.className = 'sb-overlay';
    const sb = document.createElement('aside'); sb.className = 'sidebar'; sb.setAttribute('aria-hidden', 'true');
    sb.innerHTML = `<div class="sb-head">${brand}<button type="button" class="sb-x" id="sbClose" aria-label="Close"><i class="fas fa-xmark"></i></button></div>
      <div class="sb-user"><div class="sb-av">${escH(ini)}</div><div><b class="keep-case">${escH(S.email || 'GUEST')}</b><small>WALLET ₱<span id="coinBal">0</span></small></div></div>
      <a class="sb-add" href="/BUYPOINTS/buypoints.html"><i class="fas fa-circle-plus"></i> ADD FUNDS</a>
      <nav class="sb-nav">${links.map((l, i) => `<a style="--i:${i}" class="${here.includes(l[0].toLowerCase().split('/')[1]) ? 'on' : ''}" href="${l[0]}"><i class="fas ${l[1]}"></i><span>${l[2]}</span><i class="fas fa-chevron-right sb-arr"></i></a>`).join('')}</nav>
      <button type="button" id="logoutBtn" class="sb-out"><i class="fas fa-right-from-bracket"></i> LOGOUT</button>`;
    document.body.prepend(sb); document.body.prepend(ov); document.body.prepend(hd); countUp($('#coinBal'), S.coins);
    const setSb = (o) => { document.body.classList.toggle('sb-open', o); sb.setAttribute('aria-hidden', !o); $('#menuBtn').setAttribute('aria-expanded', o); document.documentElement.style.overflow = o ? 'hidden' : ''; };
    $('#menuBtn').addEventListener('click', () => setSb(!document.body.classList.contains('sb-open')));
    $('#sbClose').addEventListener('click', () => setSb(false)); ov.addEventListener('click', () => setSb(false));
    addEventListener('keydown', (e) => e.key === 'Escape' && setSb(false));
    $('#logoutBtn').addEventListener('click', () => { localStorage.removeItem(TOK); location.href = '/AUTH/login.html'; });
    setInterval(() => !document.hidden && api('ping', { quiet: true }), 30000);
    if (!location.pathname.includes('SUPPORT')) { const f = document.createElement('a'); f.className = 'fab-chat'; f.href = '/SUPPORT/support.html'; f.innerHTML = '<i class="fas fa-comment-dots"></i>'; f.title = 'Support'; document.body.appendChild(f); }
  }
  // play videos only while visible (saves battery / lag)
  const vio = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { threshold: .05 });
  $$('video').forEach((v) => { v.muted = true; vio.observe(v); });
  // scroll reveal + count-up
  const rv = new IntersectionObserver((es) => es.forEach((x) => { if (!x.isIntersecting) return; x.target.classList.add('in'); x.target.querySelectorAll('.cnt').forEach((n) => countUp2(n)); if (x.target.classList.contains('cnt')) countUp2(x.target); rv.unobserve(x.target); }), { threshold: .15 });
  const countUp2 = (n) => { if (n.dataset.done) return; n.dataset.done = 1; const to = parseFloat(n.dataset.to), dec = +(n.dataset.dec || 0), t0 = performance.now(); const st = (z) => { const k = Math.min((z - t0) / 1200, 1), v = to * (1 - Math.pow(1 - k, 3)); n.textContent = v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (n.dataset.suf || ''); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); setTimeout(() => (n.textContent = to.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (n.dataset.suf || '')), 1500); };
  $$('.reveal').forEach((x) => (reduced ? x.classList.add('in') : rv.observe(x)));
  // show/hide password
  $$('.eye').forEach((b) => b.addEventListener('click', () => { const i = b.parentElement.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; b.querySelector('i').className = i.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'; }));

  // ---- AUTH (login / register with referral code) ----
  if ($('#authForm')) {
    let mode = 'login';
    if (localStorage.getItem(TOK)) api('me', { quiet: true }).then((j) => { if (j.ok) location.replace('/HOMEPAGE/index.html'); });
    const sync = () => {
      $$('[data-reg]').forEach((x) => (x.hidden = mode !== 'reg'));
      $('#authTitle').textContent = mode === 'reg' ? 'Create account' : 'Welcome back';
      $('#authSub').textContent = mode === 'reg' ? 'Enter your referral code to register' : 'Login with your Gmail account';
      $('#authBtn').innerHTML = mode === 'reg' ? '<i class="fas fa-user-plus"></i> CREATE ACCOUNT' : '<i class="fas fa-shield-halved"></i> SIGN IN';
      $$('#authTabs button').forEach((b) => b.classList.toggle('active', b.dataset.m === mode));
      $('#passErr').hidden = true;
    };
    $$('#authTabs button').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.m; sync(); }));
    $('#authForm').addEventListener('submit', async (e) => {
      e.preventDefault(); const err = $('#passErr'), btn = $('#authBtn'); err.hidden = true;
      if (mode === 'reg' && $('#np').value !== $('#cp').value) { err.textContent = 'Passwords do not match.'; err.hidden = false; return; }
      btn.disabled = true;
      const j = await api(mode === 'reg' ? 'reg' : 'login', { email: $('#email').value, pass: $('#np').value, ref: $('#ref')?.value, quiet: true });
      btn.disabled = false;
      if (!j.ok) { err.textContent = j.err; err.hidden = false; return; }
      localStorage.setItem(TOK, j.token); go('/HOMEPAGE/index.html');
    });
    sync();
  }

  // ---- HOME: arsenal card ----
  const openProduct = (id) => go('/PRODUCT/checkout.html?p=' + id);
  if ($('#homeCatalog')) {
    if ($('#homeChips')) $('#homeChips').innerHTML = `<button class="chip active"><i class="fas fa-table-cells"></i> ALL GAMES</button>` + PRODUCTS.map((p) => `<button class="chip" data-open="${p.id}"><i class="fas fa-gamepad"></i> ${p.name}</button>`).join('');
    $('#homeCatalog').innerHTML = PRODUCTS.map((p) => `
      <article class="arsenal-card reveal" data-open="${p.id}">
        <div class="ac-shot" style="background-image:url('${p.banner}')"><span class="ac-badge"><i class="g-dot"></i> IN STOCK</span><img class="ac-icon" src="${p.img}" alt="" onerror="this.style.display='none'"></div>
        <div class="ac-body"><h3>${p.name}</h3>
          <div class="ac-tags"><span>PREMIUM</span><span>INSTANT</span><span>24/7</span></div>
          <div class="ac-foot"><div><small>STARTING</small><b>${money(Math.min(...p.plans.map((x) => x[1])))}</b></div><button class="btn btn-dark ac-btn" data-open="${p.id}"><i class="fas fa-key"></i> GET KEY</button></div></div>
      </article>`).join('');
    $('#homeCatalog').addEventListener('click', (e) => { const o = e.target.closest('[data-open]'); if (o) openProduct(o.dataset.open); });
    $$('.reveal').forEach((x) => !reduced && !x.classList.contains('in') && rv.observe(x));
  }

  // ---- CATALOG (Browse products) ----
  if ($('#prodList')) {
    const st = { game: '', plat: '', q: '' };
    const render = () => {
      const rows = PRODUCTS.filter((p) => (!st.game || p.game === st.game) && (!st.plat || p.platform === st.plat) && (p.name + p.game).toLowerCase().includes(st.q));
      $('#showing').innerHTML = `SHOWING <b>${new Set(rows.map((p) => p.game)).size}</b> GAME · <b>${rows.length}</b> PRODUCT AVAILABLE`;
      $('#chips').innerHTML = [st.game && `<button class="chip-x" data-clr="game">GAME: ${st.game} <i class="fas fa-xmark"></i></button>`, st.plat && `<button class="chip-x" data-clr="plat">PLATFORM: ${st.plat} <i class="fas fa-xmark"></i></button>`].filter(Boolean).join('');
      $('#prodList').innerHTML = rows.length ? rows.map((p) => `
        <article class="game-card" data-open="${p.id}">
          <div class="gc-banner" style="background-image:url('${p.banner}')"></div>
          <div class="gc-body">
            <div class="gc-head"><img src="${p.img}" alt="" onerror="this.style.display='none'"><h3>${p.game}</h3></div>
            <div class="gc-meta"><span>1 VERSION AVAILABLE</span><i class="fab fa-android gc-and"></i></div>
            <p class="gc-desc">${p.short}</p>
            <button class="btn btn-dark full-btn" data-open="${p.id}"><i class="fas fa-eye"></i> VIEW ALL VERSIONS <i class="fas fa-arrow-right"></i></button>
          </div></article>`).join('') : `<div class="empty-state"><i class="fas fa-box-open"></i><p>NO PRODUCTS MATCH YOUR FILTERS.</p></div>`;
    };
    $('#fGame').innerHTML = '<option value="">ALL GAMES</option>' + [...new Set(PRODUCTS.map((p) => p.game))].map((g) => `<option>${g}</option>`).join('');
    $('#fGame').addEventListener('change', (e) => { st.game = e.target.value; render(); });
    $('#fPlat').addEventListener('change', (e) => { st.plat = e.target.value; render(); });
    $('#fSearch').addEventListener('input', (e) => { st.q = e.target.value.toLowerCase(); render(); });
    $('#fClear').addEventListener('click', () => { st.game = st.plat = st.q = ''; $('#fGame').value = $('#fPlat').value = $('#fSearch').value = ''; render(); });
    $('#chips').addEventListener('click', (e) => { const x = e.target.closest('[data-clr]'); if (!x) return; st[x.dataset.clr] = ''; (x.dataset.clr === 'game' ? $('#fGame') : $('#fPlat')).value = ''; render(); });
    $('#tabAcc').addEventListener('click', () => toast('ACCOUNTS FOR SALE - COMING SOON.'));
    $('#prodList').addEventListener('click', (e) => { const o = e.target.closest('[data-open]'); if (o) openProduct(o.dataset.open); });
    render();
  }

  // ---- CHECKOUT (product page: gallery, plans, wallet, summary) ----
  if ($('#coPlans')) {
    const p = PRODUCTS.find((x) => x.id === new URLSearchParams(location.search).get('p')) || PRODUCTS[0]; let sel = p.plans.length - 1;
    $('#coCrumb').textContent = p.name; $('#coTitle').textContent = p.name; document.title = 'CHECKOUT — ' + p.name;
    $('#coTags').innerHTML = `<span class="tg tg-and"><i class="fab fa-android"></i> ${p.platform.toUpperCase()}</span><span class="tg tg-stock"><i class="g-dot"></i> IN STOCK</span>` + p.tags.map((x) => `<span class="tg tg-chip">${x}</span>`).join('');
    $('#coGallery').innerHTML = p.shots.map((s) => `<img src="${s}" alt="${p.name}" loading="lazy">`).join('');
    const gl = $('#coGallery'); $('#gPrev').addEventListener('click', () => gl.scrollBy({ left: -gl.clientWidth, behavior: 'smooth' })); $('#gNext').addEventListener('click', () => gl.scrollBy({ left: gl.clientWidth, behavior: 'smooth' }));
    $('#coSpec').innerHTML = p.desc.split('\n').map((l) => `<p>${l}</p>`).join('');
    $('#specMore').addEventListener('click', () => { const s = $('#coSpec'); s.classList.toggle('open'); $('#specMore').innerHTML = s.classList.contains('open') ? '<i class="fas fa-chevron-up"></i> SHOW LESS' : '<i class="fas fa-chevron-down"></i> SHOW MORE'; });
    $('#specFull').addEventListener('click', () => modal(`<h2>${p.name}</h2><div class="spec-full">${p.desc.split('\n').map((l) => `<p>${l}</p>`).join('')}</div><button class="btn btn-dark full-btn" data-close>CLOSE</button>`));
    $('#coPlans').innerHTML = p.plans.map((pl, i) => `<button class="co-plan" data-i="${i}"><i class="fas fa-circle-check co-chk"></i><span class="cp-dur">${pl[0]}</span><b class="cp-price">${money(pl[1])}</b>${pl[0] === 'PERMANENT' ? '<em class="best-tag">BEST</em>' : ''}<small><i class="g-dot"></i> IN STOCK</small></button>`).join('');
    const upd = () => {
      const pl = p.plans[sel], bal = loadDB().balance, left = bal - pl[1];
      $$('.co-plan').forEach((x) => x.classList.toggle('active', +x.dataset.i === sel));
      $('#coBal').textContent = money(bal); $('#sumProd').textContent = p.name; $('#sumType').textContent = p.type; $('#sumDur').textContent = pl[0]; $('#sumTotal').textContent = money(pl[1]);
      const r = $('#sumLeft'); r.textContent = left >= 0 ? money(left) : `-${money(-left)} SHORT`; r.className = left >= 0 ? 'ok' : 'bad';
      const b = $('#coBuy'); b.disabled = left < 0; b.innerHTML = left >= 0 ? '<i class="fas fa-bolt"></i> CONFIRM &amp; BUY' : '<i class="fas fa-ban"></i> INSUFFICIENT BALANCE';
    };
    $('#coPlans').addEventListener('click', (e) => { const x = e.target.closest('.co-plan'); if (x) { sel = +x.dataset.i; upd(); } });
    $('#coBuy').addEventListener('click', () => {
      const pl = p.plans[sel], btn = $('#coBuy'); btn.disabled = true;
      api('buy', { pid: p.id, i: sel }).then((j) => {
        if (!j.ok) { upd(); return toast(j.err); }
        S.coins = j.coins; setCoins(); upd(); api('me').then((r) => r.ok && (S.purchases = r.purchases));
        const d = modal(`<img class="done-ico" src="${ASSET.done}" alt="DONE"><h2 class="claim-title">ORDER COMPLETE</h2>
          <div class="admin-say"><b>ADMIN:</b> THANKS FOR PURCHASING LICENCE KEYS, ${escH(pl[0])}.</div>
          <button class="btn btn-purple full-btn" data-view><i class="fas fa-receipt"></i> VIEW ORDER</button>`);
        d.el.classList.add('burst'); d.el.addEventListener('click', (x) => { if (x.target.closest('[data-view]')) go('/DONEBUY/donebuy.html'); });
      });
    });
    const v = $('#coVideo'); if (v) { v.muted = true; v.play().catch(() => {}); }
    api('me', { quiet: true }).then(() => upd()); upd();
  }

  // ---- CREATE TOP-UP (fixed amounts, GCash, upload proof, submit) ----
  const tuAmt = $('#tuAmt');
  if (tuAmt && document.body.dataset.role !== 'admin') {
    let amt = 50, proof = null, proofName = '';
    $$('.tu-chip').forEach((b) => b.addEventListener('click', () => { amt = +b.dataset.a; tuAmt.value = amt.toLocaleString(); $$('.tu-chip').forEach((x) => x.classList.toggle('active', x === b)); }));
    const area = $('#proofArea'), picker = $('#proofIn'), DEF = area.innerHTML;
    picker.addEventListener('change', async () => {
      const f = picker.files && picker.files[0]; if (!f) return;
      if (f.size > 12 * 1024 * 1024) { picker.value = ''; return toast('IMAGE IS TOO BIG (MAX 12MB).'); }
      area.classList.remove('need'); area.innerHTML = `<i class="fas fa-spinner fa-spin upload-icon"></i><p>UPLOADING…</p>`;
      try { proof = await uploadReceiptDemo(f); proofName = f.name || 'proof.jpg'; }
      catch { proof = null; area.innerHTML = DEF; picker.value = ''; return toast('COULD NOT READ THAT IMAGE. PLEASE CHOOSE A JPG OR PNG.'); }
      area.innerHTML = `<i class="fas fa-circle-check upload-icon"></i><p>${escH(proofName)}</p><img src="${proof}" alt="Payment proof preview"><small>TAP TO CHANGE</small>`;
      picker.value = '';
    });
    $('#tuSubmit').addEventListener('click', async (e) => {
      const btn = e.currentTarget; if (!proof) { area.classList.add('need'); area.scrollIntoView({ behavior: 'smooth', block: 'center' }); return toast('UPLOAD YOUR PAYMENT PROOF FIRST.'); }
      btn.disabled = true; const j = await api('order', { pts: amt, name: proofName, receipt: proof }); btn.disabled = false;
      if (!j.ok) return alert(j.err);
      toast('REQUEST SENT! FUNDS WILL BE ADDED TO YOUR WALLET AFTER ADMIN REVIEW.'); setTimeout(() => go('../MYPOINTS/mypoints.html'), 1300);
    });
  }

  // ---- HOME: live balance + tilt ----
  const mpSub = $('.menu-card[href*="mypoints"] p');
  if (mpSub) mpSub.textContent = 'Wallet: ' + money(loadDB().balance);
  const hero = $('.hero-card:not(.bal-card)');
  if (hero && matchMedia('(hover:hover)').matches && !reduced) {
    hero.addEventListener('mousemove', (e) => { const r = hero.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; hero.style.transform = `perspective(900px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateY(-4px)`; });
    hero.addEventListener('mouseleave', () => (hero.style.transform = ''));
  }

  // ---- MY WALLET ----
  if ($('#histList')) {
    let f = 'all';
    const META = { approved: ['ok', 'fa-circle-check'], pending: ['warn', 'fa-clock'], cancelled: ['bad', 'fa-circle-xmark'] };
    const render = () => {
      const d = loadDB(), H = d.history, sum = (s) => H.filter((h) => h.status === s).reduce((a, h) => a + h.pts, 0), cnt = (s) => H.filter((h) => h.status === s).length;
      countUp($('#bal'), d.balance); $('#wPend').textContent = money(sum('pending')); $('#wOk').textContent = money(sum('approved')); $('#wBad').textContent = cnt('cancelled');
      $('#c-all').textContent = H.length; ['pending', 'approved', 'cancelled'].forEach((k) => ($('#c-' + k).textContent = cnt(k)));
      const rows = H.filter((h) => f === 'all' || h.status === f);
      $('#histList').innerHTML = rows.length ? rows.map((h, i) => { const m = META[h.status] || META.pending; return `
        <article class="wrow ${m[0]}" style="animation-delay:${Math.min(i, 8) * 60}ms">
          <div class="wr-ico"><i class="fas ${m[1]}"></i></div>
          <div class="wr-ti"><b>${h.manual ? 'ADDED BY ADMIN' : 'TOP-UP VIA GCASH'}</b><small>${h.id} · ${fmtDate(h.ts)}</small></div>
          <div class="wr-r"><b>+₱${h.pts.toLocaleString()}</b><span class="st st-${m[0]}">${h.status}</span></div>
        </article>`; }).join('') : `<div class="empty-state"><i class="fas fa-inbox"></i><p>NO ${f === 'all' ? '' : f.toUpperCase() + ' '}HISTORY YET.<br>ADD FUNDS TO GET STARTED.</p></div>`;
    };
    $('#histTabs').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; f = b.dataset.f; $$('#histTabs .chip').forEach((x) => x.classList.toggle('active', x === b)); render(); });
    render();
  }

  // ---- HOME: support unread ----
  const spSub = $('.menu-card[href*="support"] p');
  if (spSub && S.unread) spSub.textContent = S.unread + ' new reply from admin';

  // ---- SUPPORT CENTER (user side) ----
  const pickImg = (cb) => { const pk = document.createElement('input'); pk.type = 'file'; pk.accept = 'image/*'; pk.className = 'file-off'; document.body.appendChild(pk);
    pk.addEventListener('change', async () => { const f = pk.files && pk.files[0]; pk.value = ''; if (!f) return; if (f.size > 12 * 1024 * 1024) return toast('IMAGE IS TOO BIG (MAX 12MB).');
      try { cb(await uploadReceiptDemo(f), f.name || 'image.jpg'); } catch { toast('COULD NOT READ THAT IMAGE. PLEASE CHOOSE A JPG OR PNG.'); } }); return () => pk.click(); };
  if ($('#chatBox')) {
    let img = null, imgName = '', sig = '';
    $('#who').textContent = S.email;
    const sel = $('#orderSel'), orders = [...S.orders.filter((h) => !h.manual).map((h) => ({ id: h.id, ts: h.ts, label: `${h.id} - ₱${h.pts} top-up (${h.status})` })), ...S.purchases.map((p) => ({ id: p.id, ts: p.ts, label: `${p.id} - ${p.product} ${p.plan}` }))].sort((a, b) => b.ts - a.ts);
    sel.innerHTML = `<option value="">No specific order</option>` + orders.map((o, i) => `<option value="${i}"${i ? '' : ' selected'}>${escH(o.label)}</option>`).join('');
    const render = async (force) => {
      const j = await api('chat', { quiet: true }); if (!j.ok) return;
      const k = j.msgs.length + ':' + (j.msgs.at(-1)?.id || ''); if (k === sig && !force) return; sig = k;
      const box = $('#chatBox'), near = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      box.innerHTML = j.msgs.length ? j.msgs.map((m) => bubble(m, m.from === 'user', m.from === 'user' ? S.email : 'ARCHESZ ADMIN')).join('') : `<div class="empty-state"><i class="fas fa-headset"></i><p>No messages yet.<br>Tell us your problem about your order.</p></div>`;
      if (near || !box._init || force) { box.scrollTop = box.scrollHeight; box._init = 1; }
    };
    const chip = () => { $('#attachChip').hidden = !img; $('#attachChip').innerHTML = img ? `<i class="fas fa-image"></i> ${escH(imgName)} <button type="button" id="rmImg">✕</button>` : ''; };
    $('#attachBtn').addEventListener('click', pickImg((d, n) => { img = d; imgName = n; chip(); }));
    $('#attachChip').addEventListener('click', (e) => { if (e.target.id === 'rmImg') { img = null; chip(); } });
    const send = async () => {
      const t = $('#msgIn').value.trim(); if (!t && !img) return toast('Type a message or attach an image.');
      const o = sel.value === '' ? null : orders[+sel.value];
      const j = await api('csend', { text: t, img, orderId: o ? o.id : '', orderTime: o ? fmtTime(o.ts) : '' }); if (!j.ok) return toast(j.err);
      $('#msgIn').value = ''; img = null; chip(); render(true);
    };
    $('#sendBtn').addEventListener('click', send);
    $('#msgIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
    setInterval(() => !document.hidden && render(), 5000); render(true);
  }

  // ---- FEEDBACKS ----
  if ($('#fbList')) {
    let rate = 5, img = null, imgName = '';
    const LBL = ['', 'POOR', 'FAIR', 'GOOD', 'GREAT', 'AMAZING!'];
    $('#fbWho').textContent = S.email; $('#fbAv').textContent = (S.email || 'GU').slice(0, 2).toUpperCase();
    const paint = () => { $$('#rateStars i').forEach((x, i) => x.classList.toggle('on', i < rate)); $('#rateLbl').textContent = LBL[rate]; };
    $('#rateStars').addEventListener('click', (e) => { const i = e.target.closest('i[data-n]'); if (i) { rate = +i.dataset.n; paint(); } }); paint();
    $('#fbText').addEventListener('input', (e) => { $('#fbCnt').textContent = e.target.value.length + '/400'; });
    const chip = () => { $('#fbChip').hidden = !img; $('#fbChip').innerHTML = img ? `<i class="fas fa-image"></i> ${escH(imgName)} <button type="button" id="fbRm">✕</button>` : ''; };
    $('#fbAttach').addEventListener('click', pickImg((d, n) => { img = d; imgName = n; chip(); }));
    $('#fbChip').addEventListener('click', (e) => { if (e.target.id === 'fbRm') { img = null; chip(); } });
    const ago = (ts) => { const m = Math.max(1, Math.round((Date.now() - ts) / 60000)); return m < 60 ? m + 'M AGO' : m < 1440 ? Math.round(m / 60) + 'H AGO' : Math.round(m / 1440) + 'D AGO'; };
    const load = async () => {
      const j = await api('fbs', { quiet: true }); if (!j.ok) return;
      const n = j.fbs.length;
      $('#fbAvgNum').textContent = n ? j.avg.toFixed(1) : '0.0'; $('#fbAvgStars').textContent = stars(Math.round(j.avg || 0)); $('#fbCount').textContent = n ? `${n} REVIEW${n > 1 ? 'S' : ''}` : 'BE THE FIRST TO RATE';
      $('#fbBars').innerHTML = [5, 4, 3, 2, 1].map((s) => { const k = j.fbs.filter((f) => f.stars === s).length; return `<div><span>${s} ★</span><div class="bar"><i style="width:${n ? (k / n) * 100 : 0}%"></i></div><small>${k}</small></div>`; }).join('');
      $('#fbList').innerHTML = n ? j.fbs.map((f, i) => `<article class="fb-item" style="animation-delay:${Math.min(i, 8) * 50}ms">
        <div class="fb-top"><div class="fb-av">${escH((f.email || '?').slice(0, 2).toUpperCase())}</div><div class="fb-who"><b class="fb-mail">${escH(f.email)}</b><small>${ago(f.ts)}</small></div><span class="fb-stars">${stars(f.stars)}</span></div>
        <p class="fb-text">${escH(f.text)}</p>${f.img ? `<img class="thumb" data-img src="${f.img}" alt="feedback">` : ''}</article>`).join('') : `<div class="empty-state"><i class="fas fa-star"></i><p>NO FEEDBACKS YET.</p></div>`;
    };
    $('#fbSend').addEventListener('click', async () => {
      const btn = $('#fbSend'); btn.disabled = true;
      const j = await api('fbsend', { stars: rate, text: $('#fbText').value, img }); btn.disabled = false;
      if (!j.ok) return toast(j.err);
      $('#fbText').value = ''; $('#fbCnt').textContent = '0/400'; img = null; chip(); toast('Thank you for your feedback! ⭐'); load();
    });
    setInterval(() => !document.hidden && load(), 20000); load();
  }

  // ---- DONE BUY (history transaction) ----
  if ($('#doneList')) {
    const d = loadDB(), ok = /^https?:\/\//i.test(APK_LINK); let f = 'all';
    const DAY = 864e5, mdy = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
    const all = [...d.history.filter((h) => h.status === 'approved').map((h) => ({ t: h.approvedAt || h.ts, topup: h })), ...d.purchases.map((p) => ({ t: p.ts, buy: p }))].sort((a, b) => b.t - a.t);
    $('#dbCount').textContent = d.purchases.length; $('#dbSpent').textContent = money(d.purchases.reduce((a, p) => a + (+p.pts || 0), 0));
    const life = (pl) => /PERMANENT/i.test(pl), days = (pl) => parseInt(pl) || 0;
    const draw = () => {
      const rows = all.filter((r) => f === 'all' || (f === 'buy' ? r.buy : r.topup));
      $('#doneList').innerHTML = rows.length ? rows.map((r, i) => { const dl = `style="animation-delay:${Math.min(i, 8) * 60}ms"`;
        if (r.buy) { const p = r.buy, pr = prodOf(p.product), exp = p.ts + days(p.plan) * DAY, left = Math.ceil((exp - Date.now()) / DAY), lf = life(p.plan);
          const st = lf ? ['ok', 'LIFETIME'] : left <= 0 ? ['bad', 'EXPIRED'] : left <= 3 ? ['warn', 'EXPIRING'] : ['ok', 'ACTIVE'];
          return `<article class="dcard" ${dl}>
            <div class="dc-top"><img class="dc-pic" src="${pr.img}" alt="" onerror="this.style.visibility='hidden'"><div class="dc-ti"><h3>${escH(p.product)}</h3><small>${p.id} · ${mdy(p.ts)}</small></div><span class="st st-${st[0]}">${st[1]}</span></div>
            <div class="dc-grid"><div><small>PLAN</small><b>${escH(p.plan)}</b></div><div><small>AMOUNT</small><b>₱${(+p.pts).toLocaleString()}.00</b></div><div><small>EXPIRES</small><b>${lf ? 'NEVER' : mdy(exp)}</b></div><div><small>TIME LEFT</small><b>${lf ? 'LIFETIME' : left <= 0 ? 'EXPIRED' : left + ' DAY' + (left > 1 ? 'S' : '')}</b></div></div>
            <div class="dc-act"><button class="mini-btn" data-dl><i class="fas fa-download"></i> DOWNLOAD APK</button><button class="mini-btn alt" data-share="${p.id}" data-prod="${escH(p.product)}"><i class="fas fa-share-nodes"></i> SHARE APK TO ADMIN</button></div>
          </article>`; }
        const h = r.topup; return `<article class="dcard top" ${dl}>
          <div class="dc-top"><div class="wr-ico ok"><i class="fas fa-circle-check"></i></div><div class="dc-ti"><h3>TOP-UP VIA GCASH</h3><small>${h.id} · ${mdy(h.approvedAt || h.ts)}</small></div><span class="st st-ok">COMPLETED</span></div>
          <div class="dc-grid"><div><small>AMOUNT ADDED</small><b>+₱${h.pts.toLocaleString()}</b></div><div><small>STATUS</small><b>APPROVED</b></div></div></article>`; }).join('')
        : `<div class="empty-state"><i class="fas fa-box-open"></i><p>NO ORDERS HERE YET.<br>APPROVED PURCHASES SHOW UP HERE.</p></div>`;
    };
    $('#dbTabs').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; f = b.dataset.f; $$('#dbTabs .chip').forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    draw();
    $('#doneList').addEventListener('click', async (e) => {
      const dl = e.target.closest('[data-dl]'), sh = e.target.closest('[data-share]');
      if (dl) {
        if (!ok) return toast(`APK LINK NOT SET YET - MESSAGE ${CONTACT}.`);
        dl.classList.add('downloading'); dl.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> OPENING MEDIAFIRE…';
        window.open(APK_LINK, '_blank', 'noopener');
        setTimeout(() => { dl.classList.remove('downloading'); dl.innerHTML = '<i class="fas fa-check"></i> DOWNLOAD STARTED'; }, 1600);
      }
      if (sh) {
        sh.disabled = true; const j = await api('csend', { share: sh.dataset.share, icon: location.origin + prodOf(sh.dataset.prod).img }); sh.disabled = false;
        if (!j.ok) return toast(j.err);
        sh.innerHTML = '<i class="fas fa-check"></i> SENT TO ADMIN'; sh.classList.add('sent'); toast('SENT TO ADMIN - CHECK SUPPORT CENTER FOR YOUR LICENCE.');
      }
    });
  }

  // ---- ADMIN RESULT POPUP (store side only) ----
  if (document.body.dataset.role !== 'admin' && !$('#authForm')) {
    const d = loadDB(), n = d.history.find((h) => h.status !== 'pending' && !h.seen);
    if (n) {
      const ok = n.status === 'approved';
      modal(`<div class="result-ico ${ok ? 'ok' : 'no'}"><i class="fas ${ok ? 'fa-circle-check' : 'fa-circle-xmark'}"></i></div>
        <h2>${ok ? 'YOUR ORDER APPROVED' : 'YOUR ORDER CANCELLED'}</h2>
        <p class="small-note">${ok ? `+₱${n.pts.toLocaleString()} added to your wallet` : `Order ${n.id} was cancelled`}</p>
        <p class="small-note">For more Inquiries: <b class="text-green">${CONTACT}</b></p>
        <button class="btn btn-purple full-btn" data-close>OK</button>`,
        () => { api('seen', { quiet: true }); });
    }
  }
});
