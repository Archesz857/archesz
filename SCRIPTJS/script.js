// ARCHESZ STORE - FRONT-END DEMO ONLY (no real login / payment backend)

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
const PRODUCTS = [{
  id: 'archesz-v157', name: 'ARCHESZ v1.57 ( INJECTOR )', version: 'v1.57', img: '../IMAGES/YOURPIC.png', /* <-- put YOUR image file in IMAGES/ and change this name */ cat: ['Android', 'Mobile', 'TOOLS'], icon: 'fa-syringe',
  desc: 'Premium ARCHESZ injector - super safe and strong bypass. (Edit this description in PRODUCTS inside SCRIPTJS/script.js)',
  plans: [['1 DAY', 50], ['3 DAY', 100], ['7 DAY', 250], ['LIFETIME', 899]]
}];
const CONTACT = '@Archeszcom';
// Product icon: shows your image (same size as the old icon). Falls back to the font icon if the image is missing.
const pIcon = (p, cls = 'purple-icon') => p.img
  ? `<div class="menu-icon prod-img"><img src="${p.img}" alt="${p.name}" onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'fas ${p.icon}'}))"></div>`
  : `<div class="menu-icon ${cls}"><i class="fas ${p.icon}"></i></div>`;
const prodOf = (name) => PRODUCTS.find((x) => x.name === name) || PRODUCTS[0];

// ===== SUPPORT CENTER chat (shared by store + admin through localStorage) =====
const CHAT = 'archesz_chat';
const loadChat = () => { try { return JSON.parse(localStorage.getItem(CHAT)) || []; } catch { return []; } };
const saveChat = (m) => { try { localStorage.setItem(CHAT, JSON.stringify(m)); return true; } catch { return false; } };
const escH = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtTime = (t) => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const bubble = (m, mine, name) => `<div class="msg ${mine ? 'me' : 'them'}"><div class="msg-name">${escH(name)}</div>${m.text ? `<p>${escH(m.text)}</p>` : ''}${m.img ? `<img class="msg-img" data-img src="${m.img}" alt="image">` : ''}${m.orderId ? `<div class="msg-order"><span>ORDER ID: ${escH(m.orderId)}</span><span>ORDER TIME: ${escH(m.orderTime)}</span></div>` : ''}<small>${fmtTime(m.ts)}</small></div>`;
document.addEventListener('click', (e) => { const i = e.target.closest('img[data-img]'); if (i) modal(`<img class="rcpt-full" src="${i.src}"><button class="btn btn-dark full-btn" data-close>Close</button>`); });

// ===== Demo data store (localStorage, front-end only) =====
const DB = 'archesz_demo';
const loadDB = () => { let d = {}; try { d = JSON.parse(localStorage.getItem(DB)) || {}; } catch {} return { balance: 0, history: [], purchases: [], ...d }; };
const saveDB = (d) => { try { localStorage.setItem(DB, JSON.stringify(d)); return true; } catch { return false; } };
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
  const P = Array.from({ length: 46 }, (_, i) => ({ c: ['0,255,163','34,211,238','177,140,255','255,79,216'][i % 4], x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: Math.random() * 1.8 + .4, v: Math.random() * .35 + .1, a: Math.random() * .5 + .15, d: Math.random() * 6 }));
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

document.addEventListener('DOMContentLoaded', () => {
  initFX();
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ---- AUTH ----
  $('#googleBtn')?.addEventListener('click', () => alert('Demo: Google sign-in is not connected.'));
  $('#loginForm')?.addEventListener('submit', (e) => { e.preventDefault(); const d = loadDB(); d.user = { email: $('#email').value.trim() }; saveDB(d); go('verify.html'); });

  if ($('#timer')) {
    let t = 600;
    const tick = () => {
      const m = String(Math.floor(t / 60)).padStart(2, '0'), s = String(t % 60).padStart(2, '0');
      $('#timer').textContent = `Code expires in ${m}:${s}`;
      if (t > 0) t--;
    };
    tick(); setInterval(tick, 1000);
    const boxes = [...$$('.otp')];
    boxes.forEach((b, i) => {
      b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, ''); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); });
      b.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
      b.addEventListener('paste', (e) => {
        const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
        if (!d) return; e.preventDefault();
        [...d].forEach((c, k) => { if (boxes[k]) boxes[k].value = c; });
        boxes[Math.min(d.length, 5)].focus();
      });
    });
    $('#verifyForm').addEventListener('submit', (e) => { e.preventDefault(); go('setpass.html'); });
  }

  $('#passForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const a = $('#np').value, b = $('#cp').value, err = $('#passErr');
    const msg = a.length < 8 ? 'Password must be at least 8 characters.' : a !== b ? 'Passwords do not match.' : '';
    err.hidden = !msg; err.textContent = msg;
    if (!msg) go('../HOMEPAGE/index.html');
  });

  // ---- SHOP: products ----
  const filterBtns = $$('.filter-btn');
  if ($('#prodList')) {
    let cat = 'All', q = '';
    const render = () => {
      const rows = PRODUCTS.filter((p) => (cat === 'All' || p.cat.includes(cat)) && p.name.toLowerCase().includes(q));
      $('#prodList').innerHTML = rows.length ? rows.map((p) => `
        <div class="panel-card prod-card" data-id="${p.id}">
          <div class="prod-head">${pIcon(p)}<div><h2>${p.name}</h2><span class="pill approved">${p.version}</span></div></div>
          <p class="prod-desc">${p.desc}</p>
          <div class="prod-foot"><div><small>Starting price</small><div class="purple-txt">${Math.min(...p.plans.map((x) => x[1]))} pts</div></div>
          <button class="btn btn-purple" data-buy><i class="fas fa-bolt"></i> Buy with points</button></div>
        </div>`).join('') : `<div class="empty-state"><i class="fas fa-box-open"></i><p>No products here yet.</p></div>`;
    };
    filterBtns.forEach((b) => b.addEventListener('click', () => { filterBtns.forEach((x) => x.classList.remove('active')); b.classList.add('active'); cat = b.textContent.trim(); render(); }));
    $('.search-box input').addEventListener('input', (e) => { q = e.target.value.toLowerCase(); render(); });
    $('#prodList').addEventListener('click', (e) => {
      if (!e.target.closest('[data-buy]')) return;
      const p = PRODUCTS.find((x) => x.id === e.target.closest('.prod-card').dataset.id); let sel = 0;
      const m = modal(`<div class="modal-ico">${pIcon(p)}</div><h2>${p.name}</h2><p class="small-note" style="margin:0 0 14px">Choose a plan - Balance: <b class="purple-txt" style="font-size:16px">${loadDB().balance.toLocaleString()} pts</b></p>
        <div class="plan-list">${p.plans.map((pl, i) => `<button class="plan-btn${i ? '' : ' active'}" data-i="${i}"><span>${pl[0]}</span><b>${pl[1]} pts</b></button>`).join('')}</div>
        <button class="btn btn-purple full-btn" data-confirm><i class="fas fa-bolt"></i> Confirm purchase</button><button class="link-btn" data-close>Cancel</button>`);
      m.el.addEventListener('click', (ev) => {
        const pb = ev.target.closest('.plan-btn');
        if (pb) { sel = +pb.dataset.i; m.el.querySelectorAll('.plan-btn').forEach((x) => x.classList.toggle('active', x === pb)); }
        if (ev.target.closest('[data-confirm]')) {
          const d = loadDB(), pl = p.plans[sel];
          if (d.balance < pl[1]) return toast(`Not enough points - you need ${(pl[1] - d.balance).toLocaleString()} more. Buy points first.`);
          d.balance -= pl[1]; d.purchases.unshift({ id: 'PRD-' + Math.random().toString(36).slice(2, 8).toUpperCase(), product: p.name, plan: pl[0], pts: pl[1], ts: Date.now() });
          saveDB(d); m.close(); toast(`Purchased ${pl[0]} - message ${CONTACT} to receive it.`);
        }
      });
    });
    render();
  }

  // ---- BUY POINTS ----
  const pointInput = $('.input-points input');
  if (pointInput) {
    const num = () => parseInt(String(pointInput.value).replace(/,/g, '')) || 0;
    const update = () => {
      const v = num();
      $('#sumPts').textContent = v ? v.toLocaleString() + ' pts' : '—';
      $('#sumTotal').textContent = '₱' + v.toLocaleString();
    };
    pointInput.addEventListener('input', update);
    $$('.quick-btns button').forEach((btn) => btn.addEventListener('click', () => {
      pointInput.value = btn.textContent.replace(/,/g, '').trim();
      update();
    }));
    const balEl = $('.sum-row .purple-txt'); if (balEl) balEl.textContent = loadDB().balance.toLocaleString() + ' pts';
    update();

    // Screenshot upload (demo)
    let proof = null, proofName = '';
    const area = $('.upload-area');
    const picker = document.createElement('input');
    picker.type = 'file'; picker.accept = 'image/png,image/jpeg'; picker.hidden = true;
    document.body.appendChild(picker);
    area.addEventListener('click', () => picker.click());
    picker.addEventListener('change', async () => {
      const f = picker.files[0]; if (!f) return;
      if (f.size > 5 * 1024 * 1024) return alert('Max file size is 5MB.');
      area.innerHTML = `<i class="fas fa-spinner fa-spin upload-icon"></i><p>Uploading (demo)…</p>`;
      try { proof = await uploadReceiptDemo(f); proofName = f.name; } catch { proof = null; return alert('Could not read that image.'); }
      area.innerHTML = `<i class="fas fa-circle-check upload-icon"></i><p>${f.name.replace(/</g, '&lt;')}</p><img src="${URL.createObjectURL(f)}" alt="Payment proof preview">`;
    });

    $('.full-btn').addEventListener('click', (e) => {
      e.preventDefault();
      if (num() < 50) return alert('Minimum purchase is 50 points.');
      if (!proof) return alert('Please upload your payment screenshot.');
      const d = loadDB();
      d.history.unshift({ id: 'ARC-' + Math.random().toString(36).slice(2, 8).toUpperCase(), pts: num(), amount: num(), status: 'pending', ts: Date.now(), receipt: proof, name: proofName });
      if (!saveDB(d)) return alert('Storage is full - clear demo data and try again.');
      toast('Request sent! Points will be credited after admin review.');
      setTimeout(() => go('../MYPOINTS/mypoints.html'), 1300);
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
    $('#resetDemo').addEventListener('click', () => { saveDB({ balance: 0, history: [], purchases: [], user: loadDB().user }); toast('Demo data cleared'); render(); });
    render();
  }

  // ---- HOME: support unread ----
  const spSub = $('.menu-card[href*="support"] p');
  if (spSub) { const em = loadDB().user?.email || 'guest@unregistered', n = loadChat().filter((m) => m.from === 'admin' && !m.read && m.email === em).length; if (n) spSub.textContent = n + ' new reply from admin'; }

  // ---- SUPPORT CENTER (user side) ----
  if ($('#chatBox')) {
    const em = () => loadDB().user?.email || 'guest@unregistered';
    let img = null, imgName = '';
    $('#who').textContent = em();
    if (!loadDB().user) $('#regHint').hidden = false;
    const sel = $('#orderSel'), d0 = loadDB();
    const orders = [...d0.history.filter((h) => !h.manual).map((h) => ({ id: h.id, ts: h.ts, label: `${h.id} - ${h.pts} pts top-up (${h.status})` })), ...d0.purchases.map((p) => ({ id: p.id, ts: p.ts, label: `${p.id} - ${p.product} ${p.plan}` }))].sort((a, b) => b.ts - a.ts);
    sel.innerHTML = `<option value="">No specific order</option>` + orders.map((o, i) => `<option value="${i}"${i ? '' : ' selected'}>${escH(o.label)}</option>`).join('');
    const render = () => {
      const all = loadChat(); let ch = false;
      all.forEach((m) => { if (m.email === em() && m.from === 'admin' && !m.read) { m.read = true; ch = true; } });
      if (ch) saveChat(all);
      const mine = all.filter((m) => m.email === em());
      const box = $('#chatBox'), near = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      box.innerHTML = mine.length ? mine.map((m) => bubble(m, m.from === 'user', m.from === 'user' ? em() : 'ARCHESZ ADMIN')).join('') : `<div class="empty-state"><i class="fas fa-headset"></i><p>No messages yet.<br>Tell us your problem about your order.</p></div>`;
      if (near || !box._init) { box.scrollTop = box.scrollHeight; box._init = 1; }
    };
    const chip = () => { $('#attachChip').hidden = !img; $('#attachChip').innerHTML = img ? `<i class="fas fa-image"></i> ${escH(imgName)} <button type="button" id="rmImg">✕</button>` : ''; };
    const picker = document.createElement('input'); picker.type = 'file'; picker.accept = 'image/png,image/jpeg'; picker.hidden = true; document.body.appendChild(picker);
    $('#attachBtn').addEventListener('click', () => picker.click());
    picker.addEventListener('change', async () => {
      const f = picker.files[0]; picker.value = ''; if (!f) return;
      if (f.size > 5 * 1024 * 1024) return alert('Max file size is 5MB.');
      try { img = await uploadReceiptDemo(f); imgName = f.name; chip(); } catch { alert('Could not read that image.'); }
    });
    $('#attachChip').addEventListener('click', (e) => { if (e.target.id === 'rmImg') { img = null; chip(); } });
    const send = () => {
      const t = $('#msgIn').value.trim(); if (!t && !img) return toast('Type a message or attach an image.');
      const o = sel.value === '' ? null : orders[+sel.value], all = loadChat();
      all.push({ id: 'M' + Date.now().toString(36), email: em(), from: 'user', text: t, img, orderId: o ? o.id : '', orderTime: o ? fmtTime(o.ts) : '', ts: Date.now(), read: false });
      if (!saveChat(all)) return toast('Storage full - try a smaller image.');
      $('#msgIn').value = ''; img = null; chip(); render(); $('#chatBox').scrollTop = $('#chatBox').scrollHeight;
    };
    $('#sendBtn').addEventListener('click', send);
    $('#msgIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
    addEventListener('storage', (e) => { if (e.key === CHAT) render(); });
    render();
  }

  // ---- DONE BUY ----
  if ($('#doneList')) {
    const d = loadDB();
    const rows = [...d.history.filter((h) => h.status === 'approved').map((h) => ({ t: h.approvedAt || h.ts, icon: 'fa-check-circle', title: `${h.pts.toLocaleString()} pts top-up`, sub: `Order ${h.id} · ${fmtDate(h.approvedAt || h.ts)}`, pill: 'completed' })),
      ...d.purchases.map((p) => ({ t: p.ts, icon: 'fa-syringe', prod: prodOf(p.product), title: `${p.product} - ${p.plan}`, sub: `${p.id} · ${fmtDate(p.ts)} · -${p.pts} pts`, pill: 'purchased', note: true }))].sort((a, b) => b.t - a.t);
    $('#doneList').innerHTML = rows.length ? rows.map((h, i) => `
      <div class="hist-item" style="animation-delay:${i * 70}ms">
        ${h.prod ? pIcon(h.prod) : `<div class="menu-icon blue-icon"><i class="fas ${h.icon}"></i></div>`}
        <div class="hist-info"><h3>${h.title}</h3><p>${h.sub}</p></div>
        <div class="hist-right"><span class="pill approved">${h.pill}</span>${h.note ? `<button class="mini-btn" data-contact>Claim</button>` : ''}</div>
      </div>`).join('') : `<div class="empty-state"><i class="fas fa-box-open"></i><p>No completed orders yet.<br>Approved purchases show up here.</p></div>`;
    $('#doneList').addEventListener('click', (e) => { if (e.target.closest('[data-contact]')) toast(`Message ${CONTACT} with your order ID to receive your product.`); });
  }

  // ---- ADMIN RESULT POPUP (store side only) ----
  if (document.body.dataset.role !== 'admin') {
    const d = loadDB(), n = d.history.find((h) => h.status !== 'pending' && !h.seen);
    if (n) {
      const ok = n.status === 'approved';
      modal(`<div class="result-ico ${ok ? 'ok' : 'no'}"><i class="fas ${ok ? 'fa-circle-check' : 'fa-circle-xmark'}"></i></div>
        <h2>${ok ? 'YOUR ORDER APPROVED✅' : 'YOUR ORDER CANCELLED❌'}</h2>
        <p class="small-note">${ok ? `+${n.pts.toLocaleString()} Coins added to your balance` : `Order ${n.id} was cancelled`}</p>
        <p class="small-note">For more Inquiries: <b class="text-green">${CONTACT}</b></p>
        <button class="btn btn-purple full-btn" data-close>OK</button>`,
        () => { const x = loadDB(); x.history.forEach((h) => { if (h.status !== 'pending') h.seen = true; }); saveDB(x); });
    }
    addEventListener('storage', (e) => { if (e.key === DB && !$('.input-points') && !$('#chatBox')) location.reload(); });
  }
});
