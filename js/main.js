import { ARTS, CATEGORIES } from './art/index.js';
import { Board } from './engine.js';
import { Sound } from './sound.js';
import { strokeItems, drawSolution, paperCanvas, W } from './render.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const store = {
  get(k) { try { return localStorage.getItem(`calm.${k}`); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(`calm.${k}`, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(`calm.${k}`); } catch (e) { /* ignore */ } },
};
let meta = {}; try { meta = JSON.parse(store.get('meta') || '{}'); } catch (e) { meta = {}; }
const saveMeta = () => store.set('meta', JSON.stringify(meta));
const sound = new Sound(); sound.on = store.get('sound') !== 'off';
const byId = (id) => ARTS.find((a) => a.id === id);
const regionCount = (a) => a.items.filter((i) => !i.line).length;

const ICONS = {
  nature: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 19l6-9 4 5 3-4 5 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="17" cy="6" r="2.4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  flowers: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 9.4C10 6 11 3.6 12 3c1 .6 2 3 0 6.400zM14.600 12c3.400-2 5.800-1 6.400 0-.6 1-3 2-6.400 0zM12 14.600c2 3.400 1 5.800 0 6.400-1-.6-2-3 0-6.400zM9.400 12c-3.400 2-5.800 1-6.400 0 .6-1 3-2 6.400 0z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  heroes: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M13 2L5 13h6l-1 9 9-12h-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};

// ---------------------------------------------------------------- gallery
function thumb(canvas, art) {
  const size = 480; canvas.width = canvas.height = size;
  const g = canvas.getContext('2d'), s = size / W;
  const lines = () => { const l = document.createElement('canvas'); l.width = l.height = size; strokeItems(l.getContext('2d'), art.items, s, 1.2); g.drawImage(l, 0, 0); };
  g.fillStyle = '#fffdf8'; g.fillRect(0, 0, size, size);
  const saved = store.get(`paint.${art.id}`);
  if (saved) { const img = new Image(); img.onload = () => { g.drawImage(img, 0, 0, size, size); lines(); }; img.onerror = lines; img.src = saved; } else lines();
}

function buildGallery() {
  const host = $('cats'); host.innerHTML = '';
  let done = 0;
  for (const cat of CATEGORIES) {
    const arts = ARTS.filter((a) => a.cat === cat.id); if (!arts.length) continue;
    const finished = arts.filter((a) => meta[a.id]?.done).length; done += finished;
    const sec = el('section', `cat cat-${cat.id}`);
    sec.innerHTML = `<div class="cat-head"><span class="cat-ico">${ICONS[cat.id] || ''}</span><div><h2>${cat.title}</h2><p>${cat.blurb}</p></div><span class="cat-count">${finished} of ${arts.length} colored</span></div>`;
    const grid = el('div', 'grid');
    arts.forEach((a, i) => {
      const m = meta[a.id] || {}, pct = Math.round((m.pct || 0) * 100);
      const b = el('button', `card${m.done ? ' is-done' : ''}`); b.type = 'button'; b.style.setProperty('--tilt', `${[-1.1, 0.8, -0.5][i % 3]}deg`);
      const c = el('canvas'); thumb(c, a);
      const status = m.done ? 'Done' : pct > 0 ? `${pct}%` : 'Start';
      b.append(c);
      b.insertAdjacentHTML('beforeend', `<span class="card-title">${a.title}</span><span class="card-meta">${regionCount(a)} sections &middot; ${a.palette.length} colors</span><span class="card-bar"><i style="width:${m.done ? 100 : pct}%"></i></span><span class="card-chip">${status}</span>`);
      b.addEventListener('click', () => go(`#/art/${a.id}`));
      grid.append(b);
    });
    sec.append(grid); host.append(sec);
  }
  const total = ARTS.length;
  $('heroStat').innerHTML = done === total ? `<b>All ${total}</b> pictures colored` : `<b>${done}</b> of ${total} pictures colored`;
}

// ---------------------------------------------------------------- studio
let current = null, saveTimer = 0, noteTimer = 0, lastDone = null;
const els = { paper: $('paper'), zoom: $('zoom'), paint: $('paint'), lines: $('lines'), labels: $('labels') };
const board = new Board(els, {
  progress: onProgress,
  regionDone: () => sound.pop(),
  changed: () => scheduleSave(),
  history: (n) => { $('undo').disabled = n === 0; },
  mismatch: (r) => { const c = current && current.palette.find((p) => p.n === r.n); note(`That section is ${r.n}${c ? `, ${c.name}` : ''}. Pick ${r.n} to match it.`); },
  locked: () => note('That section is finished. Use the eraser to change it.'),
  finished: () => finale(),
});

function note(text) {
  const n = $('note'); n.textContent = text; n.hidden = false; n.classList.remove('show'); void n.offsetWidth; n.classList.add('show');
  clearTimeout(noteTimer); noteTimer = setTimeout(() => { n.hidden = true; }, 2600);
}

function buildPalette(art) {
  const host = $('palette'); host.innerHTML = '';
  for (const p of art.palette) {
    const b = el('button', 'sw'); b.type = 'button'; b.dataset.n = p.n; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', `Color ${p.n}, ${p.name}`);
    const lum = (parseInt(p.hex.slice(1, 3), 16) * 0.299 + parseInt(p.hex.slice(3, 5), 16) * 0.587 + parseInt(p.hex.slice(5, 7), 16) * 0.114);
    b.innerHTML = `<span class="dot" style="--c:${p.hex};--t:${lum > 168 ? '#2f2b35' : '#fff'}"><b>${p.n}</b><svg class="ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="nm">${p.name}</span><span class="left"></span>`;
    b.addEventListener('click', () => pick(p.n));
    host.append(b);
  }
}
function pick(n) {
  board.setColor(n); if (board.tool === 'erase') setTool('brush');
  document.querySelectorAll('.sw').forEach((s) => { const on = +s.dataset.n === n; s.classList.toggle('on', on); s.setAttribute('aria-checked', on); if (on) s.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
}
function onProgress(st) {
  const pct = Math.round(st.pct * 100);
  $('barFill').style.width = `${pct}%`; $('pct').textContent = `${pct}%`;
  document.querySelectorAll('.sw').forEach((s) => {
    const e = st.per[+s.dataset.n]; if (!e) return;
    s.classList.toggle('finished', e.left === 0);
    s.querySelector('.left').textContent = e.left === 0 ? 'Done' : `${e.total - e.left}/${e.total}`;
  });
  const cur = st.per[board.color];
  if (cur && cur.left === 0 && !st.allDone) { const nx = current.palette.find((p) => st.per[p.n] && st.per[p.n].left > 0); if (nx) pick(nx.n); }
}

async function open(art) {
  current = art; lastDone = null;
  $('sName').textContent = art.title; $('sCat').textContent = CATEGORIES.find((c) => c.id === art.cat).title;
  document.body.dataset.cat = art.cat;
  show('studio');
  buildPalette(art);
  await new Promise((r) => requestAnimationFrame(r));
  await board.load(art, store.get(`paint.${art.id}`));
  panTool = false; $('pan').classList.remove('on'); syncPan(); applyZoom(1, 0.5, 0.5, ...mid());
  setTool('brush'); pick(board.color);
  onProgress(board.stats());
  $('finale').hidden = true;
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!current) return; const st = board.stats();
    const ok = st.pct > 0 ? store.set(`paint.${current.id}`, board.dataUrl()) : (store.del(`paint.${current.id}`), true);
    meta[current.id] = { pct: st.pct, done: st.allDone }; saveMeta(); if (!ok) note('Could not save on this device.');
  }, 600);
}

// ---------------------------------------------------------------- finale
function finale() {
  if (!current) return;
  const art = current; meta[art.id] = { pct: 1, done: true }; saveMeta(); store.set(`paint.${art.id}`, board.dataUrl());
  sound.finish();
  setTimeout(() => {
    if (current !== art) return;
    $('fPreview').src = board.exportCanvas(480).toDataURL('image/png');
    $('fText').textContent = `${art.title} is complete. Take a breath, it looks lovely.`;
    const next = ARTS[(ARTS.indexOf(art) + 1) % ARTS.length];
    $('fNext').textContent = next === art ? 'Back to the gallery' : `Next: ${next.title}`;
    $('fNext').onclick = () => { $('finale').hidden = true; next === art ? go('#/') : go(`#/art/${next.id}`); };
    $('finale').hidden = false;
    if (window.confetti && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const o = { zIndex: 200, colors: ['#f2a31f', '#e0679a', '#2f8f83', '#6aa8ff', '#ffd23f', '#9ad07a'], gravity: 0.7, ticks: 220, scalar: 1.05 };
      window.confetti({ ...o, particleCount: 60, spread: 80, origin: { x: 0.2, y: 0.8 }, angle: 60 }); window.confetti({ ...o, particleCount: 60, spread: 80, origin: { x: 0.8, y: 0.8 }, angle: 120 });
    }
  }, 900);
}
$('fClose').onclick = () => { $('finale').hidden = true; };
$('fGallery').onclick = () => { $('finale').hidden = true; go('#/'); };
$('fSave').onclick = () => {
  board.exportCanvas(1600).toBlob((b) => {
    if (!b) return; const url = URL.createObjectURL(b), a = document.createElement('a');
    a.href = url; a.download = `calm-colors-${current.id}.png`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  });
};

// ---------------------------------------------------------------- tools
function setTool(t) { board.tool = t; $('eraser').classList.toggle('on', t === 'erase'); $('eraser').setAttribute('aria-pressed', t === 'erase'); $('wrap').classList.toggle('erasing', t === 'erase'); }
$('eraser').onclick = () => setTool(board.tool === 'erase' ? 'brush' : 'erase');
$('undo').onclick = () => board.undo();
$('guide').onclick = (e) => { board.guide = !board.guide; e.currentTarget.classList.toggle('on', board.guide); e.currentTarget.setAttribute('aria-pressed', board.guide); board.drawLabels(); };
$('inside').onclick = (e) => { board.inside = !board.inside; e.currentTarget.classList.toggle('on', board.inside); e.currentTarget.setAttribute('aria-pressed', board.inside); note(board.inside ? 'Strokes stay inside the section you start in.' : 'Free brush: paint across sections, finished ones stay locked.'); };
$('sizes').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return; board.size = +b.dataset.size;
  $('sizes').querySelectorAll('button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
});
let resetArmed = 0;
$('reset').onclick = (e) => {
  const lab = e.currentTarget.querySelector('span');
  if (!resetArmed) { lab.textContent = 'Sure? Tap again'; e.currentTarget.classList.add('warn'); resetArmed = setTimeout(() => { resetArmed = 0; lab.textContent = 'Start over'; $('reset').classList.remove('warn'); }, 3200); return; }
  clearTimeout(resetArmed); resetArmed = 0; lab.textContent = 'Start over'; e.currentTarget.classList.remove('warn'); board.reset(); pick(current.palette[0].n); scheduleSave();
};
const syncSound = () => { $('soundBtn').setAttribute('aria-pressed', sound.on); $('soundBtn').setAttribute('aria-label', sound.on ? 'Sound on' : 'Sound off'); $('soundBtn').classList.toggle('off', !sound.on); };
$('soundBtn').onclick = () => { sound.unlock(); sound.on = !sound.on; store.set('sound', sound.on ? 'on' : 'off'); syncSound(); if (sound.on) sound.pop(); };
syncSound();

// ---------------------------------------------------------------- zoom, pan and pointer painting
const wrap = $('wrap'), viewport = els.paper, cursor = $('cursor');
let zoom = 1, panTool = false, space = false, drawing = false, pinch = null, panning = null, layoutTimer = 0;
const ptrs = new Map();
const clampZ = (z) => Math.max(1, Math.min(4, z));
const vpRect = () => viewport.getBoundingClientRect();
const contentPoint = (vx, vy) => { const w = viewport.clientWidth * zoom; return { x: (viewport.scrollLeft + vx) / w, y: (viewport.scrollTop + vy) / w }; };
function applyZoom(z, ux, uy, vx, vy) {
  zoom = clampZ(z); const vw = viewport.clientWidth;
  els.zoom.style.width = els.zoom.style.height = `${zoom * 100}%`;
  viewport.scrollLeft = ux * vw * zoom - vx; viewport.scrollTop = uy * vw * zoom - vy;
  $('zFit').textContent = `${Math.round(zoom * 100)}%`;
  clearTimeout(layoutTimer); layoutTimer = setTimeout(() => board.layout(), 140);
}
function zoomAt(f, vx, vy) { const u = contentPoint(vx, vy); applyZoom(zoom * f, u.x, u.y, vx, vy); }
const mid = () => { const w = viewport.clientWidth / 2; return [w, w]; };
$('zIn').onclick = () => zoomAt(1.5, ...mid());
$('zOut').onclick = () => zoomAt(1 / 1.5, ...mid());
$('zFit').onclick = () => applyZoom(1, 0.5, 0.5, ...mid());
viewport.addEventListener('wheel', (e) => { e.preventDefault(); const r = vpRect(); zoomAt(Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top); }, { passive: false });

const syncPan = () => { const on = panTool || space; viewport.classList.toggle('panning', on); if (on) cursor.hidden = true; };
$('pan').onclick = (e) => { panTool = !panTool; e.currentTarget.classList.toggle('on', panTool); e.currentTarget.setAttribute('aria-pressed', panTool); syncPan(); if (panTool && zoom === 1) note('Zoom in with + or pinch, then drag to move around.'); };

function moveCursor(e) {
  if (e.pointerType !== 'mouse' || panTool || space) { cursor.hidden = true; return; }
  const r = wrap.getBoundingClientRect(), z = els.zoom.getBoundingClientRect(), d = (board.size / W) * z.width;
  cursor.hidden = false; cursor.style.width = cursor.style.height = `${d}px`;
  cursor.style.transform = `translate(${e.clientX - r.left - d / 2}px, ${e.clientY - r.top - d / 2}px)`;
  cursor.style.setProperty('--c', board.tool === 'erase' ? '#8a8494' : (board.colors && board.colors[board.color]) || '#2f2b35');
}
function endStroke() { if (!drawing) return; drawing = false; board.up(); }
function startPinch() {
  const [a, b] = [...ptrs.values()], r = vpRect();
  pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: zoom, u: contentPoint((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top) };
}
viewport.addEventListener('pointerdown', (e) => {
  if (!current || (e.pointerType === 'mouse' && e.button > 1)) return; sound.unlock();
  viewport.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { endStroke(); panning = null; startPinch(); return; }
  if (ptrs.size > 2) return;
  if (panTool || space || e.button === 1) { panning = { sx: e.clientX, sy: e.clientY, l: viewport.scrollLeft, t: viewport.scrollTop }; viewport.classList.add('grabbing'); e.preventDefault(); return; }
  $('note').hidden = true; drawing = true;
  const [x, y] = board.toUnits(e.clientX, e.clientY); board.down(x, y, e.pressure || 0.5, e.pointerType === 'pen'); moveCursor(e); e.preventDefault();
});
viewport.addEventListener('pointermove', (e) => {
  moveCursor(e);
  if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && ptrs.size === 2) {
    const [a, b] = [...ptrs.values()], r = vpRect();
    applyZoom(pinch.z0 * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0), pinch.u.x, pinch.u.y, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); return;
  }
  if (panning) { viewport.scrollLeft = panning.l - (e.clientX - panning.sx); viewport.scrollTop = panning.t - (e.clientY - panning.sy); return; }
  if (!drawing) return;
  const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of (list.length ? list : [e])) { const [x, y] = board.toUnits(ev.clientX, ev.clientY); board.move(x, y, ev.pressure || 0.5); }
});
const lift = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) { panning = null; viewport.classList.remove('grabbing'); } endStroke(); };
viewport.addEventListener('pointerup', lift); viewport.addEventListener('pointercancel', lift);
viewport.addEventListener('pointerleave', () => { cursor.hidden = true; });
viewport.addEventListener('contextmenu', (e) => e.preventDefault());

addEventListener('keydown', (e) => {
  if (document.body.dataset.view !== 'studio' || !$('finale').hidden || e.target.closest('input,textarea')) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); board.undo(); return; }
  if (e.key === ' ') { e.preventDefault(); if (!space) { space = true; syncPan(); } return; }
  if (e.key === '+' || e.key === '=') { zoomAt(1.4, ...mid()); return; }
  if (e.key === '-' || e.key === '_') { zoomAt(1 / 1.4, ...mid()); return; }
  if (/^[0-9]$/.test(k)) { const n = k === '0' ? 10 : +k; if (current.palette.some((p) => p.n === n)) pick(n); }
  else if (k === 'e') setTool(board.tool === 'erase' ? 'brush' : 'erase');
  else if (k === 'b') setTool('brush');
  else if (k === '[' || k === ']') { const btns = [...$('sizes').querySelectorAll('button')], i = btns.findIndex((b) => b.classList.contains('on')); btns[Math.max(0, Math.min(2, i + (k === ']' ? 1 : -1)))].click(); }
});

addEventListener('keyup', (e) => { if (e.key === ' ' && space) { space = false; syncPan(); } });

// ---------------------------------------------------------------- routing
function show(view) {
  document.body.dataset.view = view;
  $('gallery').hidden = view !== 'gallery'; $('studio').hidden = view !== 'studio';
  window.scrollTo(0, 0);
}
function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
function route() {
  const m = location.hash.match(/^#\/art\/([\w-]+)/), art = m && byId(m[1]);
  if (art) open(art); else { current = null; buildGallery(); show('gallery'); $('finale').hidden = true; }
}
$('back').onclick = () => { clearTimeout(saveTimer); if (current) { const st = board.stats(); if (st.pct > 0) { store.set(`paint.${current.id}`, board.dataUrl()); meta[current.id] = { pct: st.pct, done: st.allDone }; saveMeta(); } } go('#/'); };
addEventListener('hashchange', route);
let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (current) { applyZoom(zoom, 0.5, 0.5, ...mid()); } }, 120); });
document.fonts?.ready.then(() => { if (current) board.drawLabels(); });
window.__calm = { board, ARTS };
route();
