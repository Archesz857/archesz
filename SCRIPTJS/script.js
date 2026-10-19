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
const ASSET = { bg: '/ASSETS/shop-bg.jpg', icon: '/ASSETS/apk-icon.png', done: '/ASSETS/done-icon.png', video: '/ASSETS/buy-video.mp4', gcash: '/ASSETS/gcash.png' };
const PRODUCTS = [{
  id: 'archesz-v1', name: 'ARCHESZ V1', title: 'ARCHESZ V1', version: 'V1', img: ASSET.icon, cat: ['Android', 'Mobile', 'TOOLS'], icon: 'fa-syringe',
  tags: ['GARENA', 'LATEST VERSION', 'ARCHESZ V1'],
  desc: 'CHOOSE YOUR METHOD TO PURCHASE INSTANTLY. ARCHESZ INC.',
  plans: [['01 DAYS', 50], ['03 DAYS', 100], ['07 DAYS', 200], ['30 DAYS', 350], ['PERMANENT', 100]]
}];
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

// Floating neon particles background
function initFX() {
  const au = document.createElement('div'); au.className = 'aurora'; au.innerHTML = '<i></i><i></i><i></i><i></i>'; document.body.prepend(au);
  if (matchMedia('(hover:hover)').matches && !reduced) {
    const cg = document.createElement('div'); cg.className = 'cursor-glow'; document.body.prepend(cg);
    addEventListener('pointermove', (e) => { cg.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; });
  }
  if (reduced) return;
  const c = document.createElement('canvas'); c.id = 'fx'; document.body.prepend(c);
  const x = c.getContext('2d'); let w, h;
  const size = () => { w = c.width = innerWidth; h = c.height = innerHeight; }; size(); addEventListener('resize', size);
  const P = Array.from({ length: 46 }, (_, i) => ({ c: ['20,184,184','94,234,212','45,212,212','153,246,228'][i % 4], x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: Math.random() * 1.8 + .4, v: Math.random() * .35 + .1, a: Math.random() * .5 + .15, d: Math.random() * 6 }));
  (function draw(t) {
    x.clearRect(0, 0, w, h);
    P.forEach((p) => {
      p.y -= p.v; p.x += Math.sin(t / 1800 + p.d) * .25; if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fillStyle = `rgba(${p.c},${p.a})`; x.shadowColor = `rgb(${p.c})`; x.shadowBlur = 10; x.fill();
    });
    requestAnimationFrame(draw);
  })(0);
}

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

  // ---- TOP BALANCE BAR (tap = go to Top Up) ----
  if (!$('#authForm') && document.body.dataset.role !== 'admin') {
    const bar = document.createElement('div'); bar.className = 'coin-bar';
    bar.innerHTML = '<a href="/BUYPOINTS/buypoints.html" class="coin-link" title="Top up"><i class="fas fa-coins"></i><b id="coinBal">0</b><span>+</span></a><button type="button" id="logoutBtn" title="Logout"><i class="fas fa-right-from-bracket"></i></button>';
    document.body.appendChild(bar); countUp($('#coinBal'), S.coins);
    $('#logoutBtn').addEventListener('click', () => { localStorage.removeItem(TOK); location.href = '/AUTH/login.html'; });
    setInterval(() => api('ping', { quiet: true }), 30000);
  }

  // ---- AUTH (login / register with referral code) ----
  if ($('#authForm')) {
    let mode = 'login';
    if (localStorage.getItem(TOK)) api('me', { quiet: true }).then((j) => { if (j.ok) location.replace('/HOMEPAGE/index.html'); });
    const sync = () => {
      $$('[data-reg]').forEach((x) => (x.hidden = mode !== 'reg'));
      $('#authTitle').textContent = mode === 'reg' ? 'Create account' : 'Welcome back';
      $('#authSub').textContent = mode === 'reg' ? 'Enter your referral code to register' : 'Login with your Gmail account';
      $('#authBtn').textContent = mode === 'reg' ? 'Register' : 'Login';
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

  // ---- SHOP: products ----
  const filterBtns = $$('.filter-btn');
  if ($('#prodList')) {
    let cat = 'All', q = '';
    const money = (n) => '₱' + n.toLocaleString(undefined, { minimumFractionDigits: 2 });
    const render = () => {
      const rows = PRODUCTS.filter((p) => (cat === 'All' || p.cat.includes(cat)) && p.name.toLowerCase().includes(q));
      $('#prodList').innerHTML = rows.length ? rows.map((p) => `
        <div class="gh-card" data-id="${p.id}">
          <div class="gh-banner" style="background-image:url('${ASSET.bg}')">
            <img class="gh-appicon" src="${p.img}" alt="${p.name}" onerror="this.style.visibility='hidden'">
            <div class="gh-banner-txt"><h2>${p.title}</h2><div class="gh-and"><span class="gh-and-ico"><i class="fab fa-android"></i></span><b>ANDROID VERSION</b></div></div>
          </div>
          <div class="gh-body">
            <h3 class="gh-name">${p.name}</h3>
            <div class="gh-tags"><span class="tg tg-mod"><i class="fas fa-puzzle-piece"></i> MOD APK TO VIRTUAL APK</span><span class="tg tg-and"><i class="fab fa-android"></i> ANDROID</span><span class="tg tg-stock"><i class="g-dot"></i><i class="fas fa-circle-check"></i> IN STOCK</span></div>
            <div class="gh-tags">${p.tags.map((x) => `<span class="tg tg-chip">${x}</span>`).join('')}</div>
            <div class="gh-price">${money(Math.min(...p.plans.map((x) => x[1])))} — ${money(Math.max(...p.plans.map((x) => x[1])))} <small>PER KEY</small></div>
            <button class="btn btn-purple full-btn gh-buy" data-buy><i class="fas fa-bolt"></i> BUY NOW</button>
          </div>
        </div>`).join('') : `<div class="empty-state"><i class="fas fa-box-open"></i><p>No products here yet.</p></div>`;
    };
    filterBtns.forEach((b) => b.addEventListener('click', () => { filterBtns.forEach((x) => x.classList.remove('active')); b.classList.add('active'); cat = b.textContent.trim(); render(); }));
    $('.search-box input').addEventListener('input', (e) => { q = e.target.value.toLowerCase(); render(); });
    $('#prodList').addEventListener('click', (e) => {
      if (!e.target.closest('[data-buy]')) return;
      const p = PRODUCTS.find((x) => x.id === e.target.closest('.gh-card').dataset.id); let sel = 0;
      const m = modal(`<video class="buy-video" src="${ASSET.video}" autoplay muted loop playsinline preload="auto"></video><div class="buy-shade"></div>
        <div class="buy-inner">
          <img class="buy-icon" src="${p.img}" alt="" onerror="this.style.display='none'">
          <h2>${p.title}</h2>
          <p class="buy-desc">${p.desc}</p>
          <p class="small-note" style="margin:0 0 12px">BALANCE: <b class="purple-txt" style="font-size:16px">${loadDB().balance.toLocaleString()} PTS</b></p>
          <div class="plan-list">${p.plans.map((pl, i) => `<button class="plan-btn${i ? '' : ' active'}" data-i="${i}">${pl[0] === 'PERMANENT' ? '<em class="best-tag">BEST</em>' : ''}<span>${money(pl[1])} — ${pl[0]}</span></button>`).join('')}</div>
          <button class="btn btn-purple full-btn" data-confirm><i class="fas fa-bolt"></i> CONFIRM &amp; BUY</button><button class="link-btn" data-close>CANCEL</button>
        </div>`);
      m.el.classList.add('buy-modal'); const v = m.el.querySelector('video'); v.muted = true; v.play().catch(() => {});
      m.el.addEventListener('click', (ev) => {
        const pb = ev.target.closest('.plan-btn');
        if (pb) { sel = +pb.dataset.i; m.el.querySelectorAll('.plan-btn').forEach((x) => x.classList.toggle('active', x === pb)); }
        if (ev.target.closest('[data-confirm]')) {
          const pl = p.plans[sel], btn = ev.target.closest('[data-confirm]'); btn.disabled = true;
          api('buy', { pid: p.id, i: sel }).then((j) => {
            btn.disabled = false; if (!j.ok) return toast(j.err);
            S.coins = j.coins; setCoins(); m.close(); api('me').then((r) => r.ok && (S.purchases = r.purchases));
            const d = modal(`<img class="done-ico" src="${ASSET.done}" alt="DONE"><h2 class="claim-title">ORDER COMPLETE</h2>
              <div class="admin-say"><b>ADMIN:</b> THANKS FOR PURCHASING LICENCE KEYS, ${escH(pl[0])}.</div>
              <button class="btn btn-purple full-btn" data-view><i class="fas fa-receipt"></i> VIEW ORDER</button>`);
            d.el.classList.add('burst'); d.el.addEventListener('click', (x) => { if (x.target.closest('[data-view]')) go('/DONEBUY/donebuy.html'); });
          });
        }
      });
    });
    render();
  }

  // ---- CREATE TOP-UP (fixed amounts, GCash, upload proof, submit) ----
  const tuAmt = $('#tuAmt');
  if (tuAmt && document.body.dataset.role !== 'admin') {
    let amt = 50, proof = null, proofName = '';
    $$('.tu-chip').forEach((b) => b.addEventListener('click', () => { amt = +b.dataset.a; tuAmt.value = amt.toLocaleString(); $$('.tu-chip').forEach((x) => x.classList.toggle('active', x === b)); }));
    const area = $('.upload-area'), picker = document.createElement('input');
    picker.type = 'file'; picker.accept = '.jpg,.jpeg,.png,image/jpeg,image/png'; picker.hidden = true; document.body.appendChild(picker);
    area.addEventListener('click', () => picker.click());
    picker.addEventListener('change', async () => {
      const f = picker.files[0]; if (!f) return;
      if (!/^image\/(jpeg|png)$/.test(f.type)) { picker.value = ''; return alert('Proof must be a JPG or PNG image.'); }
      if (f.size > 5 * 1024 * 1024) return alert('Max file size is 5MB.');
      area.innerHTML = `<i class="fas fa-spinner fa-spin upload-icon"></i><p>UPLOADING…</p>`;
      try { proof = await uploadReceiptDemo(f); proofName = f.name; } catch { proof = null; return alert('Could not read that image.'); }
      area.innerHTML = `<i class="fas fa-circle-check upload-icon"></i><p>${escH(f.name)}</p><img src="${URL.createObjectURL(f)}" alt="Payment proof preview">`;
    });
    $('#tuSubmit').addEventListener('click', async (e) => {
      const btn = e.currentTarget; if (!proof) { area.classList.add('need'); area.scrollIntoView({ behavior: 'smooth', block: 'center' }); return toast('UPLOAD YOUR PROOF (JPG OR PNG) FIRST.'); }
      btn.disabled = true; const j = await api('order', { pts: amt, name: proofName, receipt: proof }); btn.disabled = false;
      if (!j.ok) return alert(j.err);
      toast('REQUEST SENT! POINTS WILL BE CREDITED AFTER ADMIN REVIEW.'); setTimeout(() => go('../MYPOINTS/mypoints.html'), 1300);
    });
  }

  // ---- HOME: live balance + tilt ----
  const mpSub = $('.menu-card[href*="mypoints"] p');
  if (mpSub) mpSub.textContent = 'Balance: ' + loadDB().balance.toLocaleString() + ' pts';
  const hero = $('.hero-card:not(.bal-card)');
  if (hero && matchMedia('(hover:hover)').matches && !reduced) {
    hero.addEventListener('mousemove', (e) => { const r = hero.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; hero.style.transform = `perspective(900px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateY(-4px)`; });
    hero.addEventListener('mouseleave', () => (hero.style.transform = ''));
  }

  // ---- MY POINTS ----
  if ($('#histList')) {
    let f = 'all';
    const render = () => {
      const d = loadDB(), list = $('#histList');
      countUp($('#bal'), d.balance);
      const rows = d.history.filter((h) => f === 'all' || h.status === f);
      list.innerHTML = rows.length ? rows.map((h, i) => `
        <div class="hist-item" style="animation-delay:${i * 70}ms">
          <div class="menu-icon ${{ approved: 'green-icon', cancelled: 'red-icon' }[h.status] || 'gold-icon'}"><i class="fas ${{ approved: 'fa-circle-check', cancelled: 'fa-circle-xmark' }[h.status] || 'fa-clock'}"></i></div>
          <div class="hist-info"><h3>${h.manual ? 'Added by admin' : 'Top-up via GCash'}</h3><p>${h.id} · ${fmtDate(h.ts)}</p></div>
          <div class="hist-right"><span class="hist-pts">+${h.pts.toLocaleString()}</span><span class="pill ${h.status}">${h.status}</span></div>
        </div>`).join('') : `<div class="empty-state"><i class="fas fa-inbox"></i><p>No ${f === 'all' ? '' : f + ' '}history yet.<br>Buy points to get started.</p></div>`;
    };
    $$('#histTabs .filter-btn').forEach((b) => b.addEventListener('click', () => { f = b.dataset.f; render(); }));
    $('#resetDemo')?.remove();
    render();
  }

  // ---- HOME: support unread ----
  const spSub = $('.menu-card[href*="support"] p');
  if (spSub && S.unread) spSub.textContent = S.unread + ' new reply from admin';

  // ---- SUPPORT CENTER (user side) ----
  const pickImg = (cb) => { const pk = document.createElement('input'); pk.type = 'file'; pk.accept = 'image/png,image/jpeg'; pk.hidden = true; document.body.appendChild(pk);
    pk.addEventListener('change', async () => { const f = pk.files[0]; pk.value = ''; if (!f) return; if (f.size > 5 * 1024 * 1024) return alert('Max file size is 5MB.');
      try { cb(await uploadReceiptDemo(f), f.name); } catch { alert('Could not read that image.'); } }); return () => pk.click(); };
  if ($('#chatBox')) {
    let img = null, imgName = '', sig = '';
    $('#who').innerHTML = `${escH(S.email)} • <span class="on-txt"><i class="on-dot"></i>Online</span>`;
    const sel = $('#orderSel'), orders = [...S.orders.filter((h) => !h.manual).map((h) => ({ id: h.id, ts: h.ts, label: `${h.id} - ${h.pts} pts top-up (${h.status})` })), ...S.purchases.map((p) => ({ id: p.id, ts: p.ts, label: `${p.id} - ${p.product} ${p.plan}` }))].sort((a, b) => b.ts - a.ts);
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
    setInterval(render, 5000); render(true);
  }

  // ---- FEEDBACKS ----
  if ($('#fbList')) {
    let rate = 5, img = null, imgName = '';
    $('#fbWho').textContent = S.email;
    const paint = () => $$('#rateStars i').forEach((x, i) => x.classList.toggle('on', i < rate));
    $('#rateStars').addEventListener('click', (e) => { const i = e.target.closest('i[data-n]'); if (i) { rate = +i.dataset.n; paint(); } }); paint();
    const chip = () => { $('#fbChip').hidden = !img; $('#fbChip').innerHTML = img ? `<i class="fas fa-image"></i> ${escH(imgName)} <button type="button" id="fbRm">✕</button>` : ''; };
    $('#fbAttach').addEventListener('click', pickImg((d, n) => { img = d; imgName = n; chip(); }));
    $('#fbChip').addEventListener('click', (e) => { if (e.target.id === 'fbRm') { img = null; chip(); } });
    const load = async () => {
      const j = await api('fbs', { quiet: true }); if (!j.ok) return;
      $('#fbAvg').textContent = j.fbs.length ? `${j.avg.toFixed(1)} ★ · ${j.fbs.length} feedback${j.fbs.length > 1 ? 's' : ''}` : 'Be the first to rate';
      $('#fbList').innerHTML = j.fbs.length ? j.fbs.map((f, i) => `<div class="order-card fb-card" style="animation-delay:${i * 60}ms"><div class="order-top"><h3 class="fb-mail">${escH(f.email)}</h3><span class="fb-stars">${stars(f.stars)}</span></div><p class="fb-text">${escH(f.text)}</p>${f.img ? `<img class="thumb" data-img src="${f.img}" alt="feedback">` : ''}<small class="fb-time">${fmtTime(f.ts)}</small></div>`).join('') : `<div class="empty-state"><i class="fas fa-star"></i><p>No feedbacks yet.</p></div>`;
    };
    $('#fbSend').addEventListener('click', async () => {
      const btn = $('#fbSend'); btn.disabled = true;
      const j = await api('fbsend', { stars: rate, text: $('#fbText').value, img }); btn.disabled = false;
      if (!j.ok) return toast(j.err);
      $('#fbText').value = ''; img = null; chip(); toast('Thank you for your feedback! ⭐'); load();
    });
    setInterval(load, 15000); load();
  }

  // ---- DONE BUY (history transaction) ----
  if ($('#doneList')) {
    const d = loadDB(), ok = /^https?:\/\//i.test(APK_LINK);
    const rows = [...d.history.filter((h) => h.status === 'approved').map((h) => ({ t: h.approvedAt || h.ts, topup: h })),
      ...d.purchases.map((p) => ({ t: p.ts, buy: p }))].sort((a, b) => b.t - a.t);
    $('#doneList').innerHTML = rows.length ? rows.map((r, i) => r.buy ? `
      <div class="hist-item buy-hist" style="animation-delay:${i * 70}ms">
        <img class="hist-apk" src="${ASSET.icon}" alt="" onerror="this.style.visibility='hidden'">
        <div class="hist-info"><h3>${escH(r.buy.product)}</h3><p>EXPIRATION: ${escH(r.buy.plan)}</p><p>AMOUNT: ₱${(+r.buy.pts).toLocaleString()}.00</p><p class="hist-id">${r.buy.id} · ${fmtDate(r.buy.ts)}</p></div>
        <div class="hist-actions"><button class="mini-btn" data-dl><i class="fas fa-download"></i> DOWNLOAD APK</button><button class="mini-btn alt" data-share="${r.buy.id}"><i class="fas fa-share-nodes"></i> SHARE APK TO ADMIN</button></div>
      </div>` : `
      <div class="hist-item" style="animation-delay:${i * 70}ms">
        <div class="menu-icon blue-icon"><i class="fas fa-check-circle"></i></div>
        <div class="hist-info"><h3>${r.topup.pts.toLocaleString()} PTS TOP-UP</h3><p>ORDER ${r.topup.id} · ${fmtDate(r.topup.approvedAt || r.topup.ts)}</p></div>
        <div class="hist-right"><span class="pill approved">completed</span></div>
      </div>`).join('') : `<div class="empty-state"><i class="fas fa-box-open"></i><p>NO COMPLETED ORDERS YET.<br>APPROVED PURCHASES SHOW UP HERE.</p></div>`;
    $('#doneList').addEventListener('click', async (e) => {
      const dl = e.target.closest('[data-dl]'), sh = e.target.closest('[data-share]');
      if (dl) {
        if (!ok) return toast(`APK LINK NOT SET YET - MESSAGE ${CONTACT}.`);
        dl.classList.add('downloading'); dl.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> OPENING MEDIAFIRE…';
        window.open(APK_LINK, '_blank', 'noopener');
        setTimeout(() => { dl.classList.remove('downloading'); dl.innerHTML = '<i class="fas fa-check"></i> DOWNLOAD STARTED'; }, 1600);
      }
      if (sh) {
        sh.disabled = true; const j = await api('csend', { share: sh.dataset.share, icon: location.origin + ASSET.icon }); sh.disabled = false;
        if (!j.ok) return toast(j.err);
        sh.innerHTML = '<i class="fas fa-check"></i> SENT TO ADMIN'; sh.classList.add('sent'); toast('SENT TO ADMIN ✅ - CHECK SUPPORT CENTER FOR YOUR LICENCE.');
      }
    });
  }

  // ---- ADMIN RESULT POPUP (store side only) ----
  if (document.body.dataset.role !== 'admin' && !$('#authForm')) {
    const d = loadDB(), n = d.history.find((h) => h.status !== 'pending' && !h.seen);
    if (n) {
      const ok = n.status === 'approved';
      modal(`<div class="result-ico ${ok ? 'ok' : 'no'}"><i class="fas ${ok ? 'fa-circle-check' : 'fa-circle-xmark'}"></i></div>
        <h2>${ok ? 'YOUR ORDER APPROVED✅' : 'YOUR ORDER CANCELLED❌'}</h2>
        <p class="small-note">${ok ? `+${n.pts.toLocaleString()} Coins added to your balance` : `Order ${n.id} was cancelled`}</p>
        <p class="small-note">For more Inquiries: <b class="text-green">${CONTACT}</b></p>
        <button class="btn btn-purple full-btn" data-close>OK</button>`,
        () => { api('seen', { quiet: true }); });
    }
  }
});
