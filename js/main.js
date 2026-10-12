import { ARTS, CATEGORIES } from './art/index.js';
import { Board } from './engine.js';
import { Sound } from './sound.js';
import { paint } from './store.js';
import { strokeItems, W, PAPER } from './render.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const store = {
  get(k) { try { return localStorage.getItem(`calm.${k}`); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(`calm.${k}`, v); return true; } catch (e) { return false; } },
};
let meta = {}; try { meta = JSON.parse(store.get('meta') || '{}'); } catch (e) { meta = {}; }
const saveMeta = () => store.set('meta', JSON.stringify(meta));
let drawings = []; try { drawings = JSON.parse(store.get('drawings') || '[]'); } catch (e) { drawings = []; }
const saveDrawings = () => store.set('drawings', JSON.stringify(drawings));
const FREE_COLORS = [['Ink', '#1c1c1e'], ['Red', '#ff3b30'], ['Orange', '#ff9500'], ['Yellow', '#ffcc00'], ['Green', '#34c759'], ['Teal', '#30b0c7'], ['Blue', '#0a84ff'], ['Purple', '#af52de'], ['Pink', '#ff6482'], ['Brown', '#a2845e'], ['Grey', '#8e8e93'], ['White', '#ffffff']];
let customHex = '#7c5cff';
const freeArt = (id) => ({ id, free: true, cat: 'free', title: (drawings.find((d) => d.id === id) || {}).title || 'Drawing', items: [], palette: [...FREE_COLORS.map(([name, hex], i) => ({ n: i + 1, name, hex })), { n: 99, name: 'Custom', hex: customHex }] });
const sound = new Sound(); sound.on = store.get('sound') !== 'off';
const byId = (id) => ARTS.find((a) => a.id === id);
const regionCount = (a) => a.items.filter((i) => !i.line).length;

const ICONS = {
  nature: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 21V9M12 9c-4 0-6-3-6-6 4 0 6 2 6 6zM12 13c4 0 6-3 6-6-4 0-6 2-6 6zM12 17c-3 0-5-2-5-4.500 3 0 5 1.500 5 4.500z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  heroes: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3l8 3v6c0 4.500-3.400 7.800-8 9-4.600-1.200-8-4.500-8-9V6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 7l-4 6h3l-1 4 4-6h-3z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  arts: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="8.500" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.500" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 3.500v17M3.500 12h17M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1" opacity=".7"/></svg>',
};

// ---------------------------------------------------------------- gallery
async function thumb(canvas, art) {
  const size = 480; canvas.width = canvas.height = size;
  const g = canvas.getContext('2d'), s = size / W;
  g.fillStyle = PAPER; g.fillRect(0, 0, size, size);
  await paint.withUrl(art.id, (url) => new Promise((res) => {
    if (!url) { res(); return; }
    const img = new Image(); img.onload = () => { g.drawImage(img, 0, 0, size, size); res(); }; img.onerror = () => res(); img.src = url;
  }));
  if (art.free) return;
  const l = document.createElement('canvas'); l.width = l.height = size; strokeItems(l.getContext('2d'), art.items, s, 1); g.drawImage(l, 0, 0);
}

let tab = 'color', editing = false;
function setTab(t) {
  tab = t; editing = false;
  document.querySelector('.seg2').dataset.tab = t;
  $('tabColor').setAttribute('aria-selected', t === 'color'); $('tabFree').setAttribute('aria-selected', t === 'free');
  $('cats').hidden = t !== 'color'; $('free').hidden = t !== 'free';
  $('editBtn').hidden = t !== 'free' || !drawings.length; $('editBtn').textContent = 'Select';
  $('free').classList.remove('editing');
  buildStat();
}
function buildStat() {
  if (tab === 'free') { $('heroStat').innerHTML = drawings.length ? `<b>${drawings.length}</b> ${drawings.length === 1 ? 'drawing' : 'drawings'} on this device` : 'A blank page, a pen and your imagination.'; return; }
  const done = ARTS.filter((a) => meta[a.id]?.done).length, total = ARTS.length;
  $('heroStat').innerHTML = done === total ? `<b>All ${total}</b> pictures colored` : `<b>${done}</b> of ${total} pictures colored`;
}
$('tabColor').onclick = () => go('#/'); $('tabFree').onclick = () => go('#/free');
$('editBtn').onclick = () => { editing = !editing; $('free').classList.toggle('editing', editing); $('editBtn').textContent = editing ? 'Done' : 'Select'; $('free').querySelectorAll('.del').forEach((d) => { d.textContent = '\u2212'; d.dataset.armed = ''; }); };

function buildGallery() {
  const host = $('cats'); host.innerHTML = '';
  for (const cat of CATEGORIES) {
    const arts = ARTS.filter((a) => a.cat === cat.id); if (!arts.length) continue;
    const finished = arts.filter((a) => meta[a.id]?.done).length;
    const sec = el('section', `cat cat-${cat.id}`);
    sec.innerHTML = `<div class="cat-head"><h2>${cat.title}</h2><p>${cat.blurb}</p><span class="cat-count">${finished} of ${arts.length} colored</span></div>`;
    const grid = el('div', 'grid');
    arts.forEach((a, idx) => {
      const m = meta[a.id] || {}, pct = Math.round((m.pct || 0) * 100);
      const b = el('button', `card${m.done ? ' is-done' : ''}`); b.type = 'button'; b.style.setProperty('--i', idx);
      const c = el('canvas'); thumb(c, a);
      const status = m.done ? 'Done' : pct > 0 ? `${pct}%` : 'New';
      b.append(c);
      b.insertAdjacentHTML('beforeend', `<span class="card-title">${a.title}</span><span class="card-meta">${regionCount(a)} sections &middot; ${a.palette.length} colors</span><span class="card-bar"><i style="width:${m.done ? 100 : pct}%"></i></span><span class="card-chip">${status}</span>`);
      b.addEventListener('click', () => go(`#/art/${a.id}`));
      grid.append(b);
    });
    sec.append(grid); host.append(sec);
  }
  buildFree();
  setTab(tab);
}

function buildFree() {
  const host = $('free'); host.innerHTML = '';
  const grid = el('div', 'grid');
  const nb = el('button', 'card new'); nb.type = 'button';
  nb.innerHTML = '<span class="tile"><span class="plus"><svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span></span><span class="card-title">New Drawing</span><span class="card-meta">Blank page</span>';
  nb.onclick = () => go('#/draw/new');
  grid.append(nb);
  [...drawings].sort((a, b) => b.t - a.t).forEach((d, idx) => {
    const b = el('div', 'card'); b.style.setProperty('--i', idx + 1); b.tabIndex = 0; b.setAttribute('role', 'button');
    const c = el('canvas'); thumb(c, { id: d.id, free: true, items: [] });
    const del = el('button', 'del', '\u2212'); del.type = 'button'; del.setAttribute('aria-label', `Delete ${d.title}`);
    del.onclick = async (e) => {
      e.stopPropagation();
      if (!del.dataset.armed) { del.dataset.armed = '1'; del.textContent = 'Delete'; return; }
      await paint.del(d.id); drawings = drawings.filter((x) => x.id !== d.id); saveDrawings();
      b.style.transition = 'opacity .2s, transform .2s'; b.style.opacity = '0'; b.style.transform = 'scale(.9)';
      setTimeout(() => { buildFree(); $('free').classList.toggle('editing', editing && drawings.length > 0); if (!drawings.length) { editing = false; $('editBtn').hidden = true; } buildStat(); }, 200);
    };
    b.append(c, del);
    b.insertAdjacentHTML('beforeend', `<span class="card-title">${d.title}</span><span class="card-meta">${new Date(d.t).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>`);
    b.addEventListener('click', () => { if (!editing) go(`#/draw/${d.id}`); });
    b.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !editing) go(`#/draw/${d.id}`); });
    grid.append(b);
  });
  host.append(grid);
  if (!drawings.length) host.append(el('p', 'empty', 'Your drawings are saved here automatically.'));
}

// ---------------------------------------------------------------- studio
let current = null, saveTimer = 0, noteTimer = 0, lastMismatch = 0, drawing = false;
const els = { paper: $('paper'), zoom: $('zoom'), paint: $('paint'), lines: $('lines'), labels: $('labels') };
const board = new Board(els, {
  progress: onProgress,
  regionDone: () => sound.pop(),
  changed: () => scheduleSave(),
  history: (n, r = 0) => { $('undo').disabled = n === 0; $('redo').disabled = r === 0; },
  mismatch: (r) => {
    const now = performance.now(); if (now - lastMismatch < 14000) return; lastMismatch = now;
    const c = current && current.palette.find((p) => p.n === r.n); note(`That section is ${r.n}${c ? `, ${c.name}` : ''}. Pick ${r.n} to match the number.`);
  },
  finished: () => finale(),
});

function note(text) {
  const n = $('note'); n.textContent = text; n.hidden = false; n.classList.remove('show'); void n.offsetWidth; n.classList.add('show');
  clearTimeout(noteTimer); noteTimer = setTimeout(() => { n.hidden = true; }, 2800);
}

function buildPalette(art) {
  const host = $('palette'); host.innerHTML = '';
  for (const p of art.palette) {
    const b = el('button', 'sw'); b.type = 'button'; b.dataset.n = p.n; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', `Color ${p.n}, ${p.name}`);
    const lum = (parseInt(p.hex.slice(1, 3), 16) * 0.299 + parseInt(p.hex.slice(3, 5), 16) * 0.587 + parseInt(p.hex.slice(5, 7), 16) * 0.114);
    b.innerHTML = `<span class="dot" style="--c:${p.hex};--t:${lum > 170 ? '#26302b' : '#fff'}"><b>${p.n}</b><svg class="ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="nm">${p.name}</span><span class="left"></span>`;
    if (art.free && p.n === 99) {
      b.classList.add('wheel'); b.setAttribute('aria-label', 'Custom color');
      b.innerHTML = `<span class="dot wheelring"><i style="background:${p.hex}"></i></span><input type="color" value="${p.hex}" tabindex="-1" aria-hidden="true">`;
      const inp = b.querySelector('input');
      inp.addEventListener('input', () => { p.hex = customHex = inp.value; board.colors[99] = p.hex; b.querySelector('i').style.background = p.hex; $('toolbar').style.setProperty('--c', p.hex); });
      b.addEventListener('click', (e) => { if (e.target !== inp) { pick(99); inp.click(); } });
    } else b.addEventListener('click', () => pick(p.n));
    host.append(b);
  }
}
function pick(n) {
  board.setColor(n); if (board.tool === 'erase') setTool('brush');
  { const p = current && current.palette.find((q) => q.n === n); if (p) $('toolbar').style.setProperty('--c', p.hex); }
  document.querySelectorAll('.sw').forEach((s) => { const on = +s.dataset.n === n; s.classList.toggle('on', on); s.setAttribute('aria-checked', on); if (on) s.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); });
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
  if (!drawing && cur && cur.left === 0 && !st.allDone) { const nx = current.palette.find((p) => st.per[p.n] && st.per[p.n].left > 0); if (nx) pick(nx.n); }
}

async function open(art) {
  current = art;
  $('sName').textContent = art.title; $('sCat').textContent = art.free ? '' : CATEGORIES.find((c) => c.id === art.cat).title;
  document.body.dataset.cat = art.cat; $('studio').dataset.mode = art.free ? 'free' : 'color';
  applyToolset(art.free ? 'free' : 'color', 1);
  show('studio');
  buildPalette(art);
  await new Promise((r) => requestAnimationFrame(r));
  await paint.withUrl(art.id, (url) => board.load(art, url));
  if (current !== art) return;
  panTool = false; $('pan').classList.remove('on'); syncPan(); applyZoom(1, 0.5, 0.5, ...mid());
  setTool('brush'); pick(board.color);
  onProgress(board.stats());
  $('finale').hidden = true;
}

async function persist() {
  if (!current) return; const art = current;
  if (art.free) {
    if (board.hasPaint()) {
      const b = await board.toBlob(); if (b && !(await paint.set(art.id, b))) note('Could not save on this device.');
      const d = drawings.find((x) => x.id === art.id); if (d) d.t = Date.now(); else drawings.push({ id: art.id, title: art.title, t: Date.now() }); saveDrawings();
    } else { await paint.del(art.id); drawings = drawings.filter((x) => x.id !== art.id); saveDrawings(); }
    return;
  }
  const st = board.stats();
  if (board.hasPaint()) { const b = await board.toBlob(); if (b && !(await paint.set(art.id, b))) note('Could not save on this device.'); } else await paint.del(art.id);
  meta[art.id] = { pct: st.pct, done: st.allDone }; saveMeta();
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 700); }

// ---------------------------------------------------------------- finale
function finale() {
  if (!current) return;
  const art = current; meta[art.id] = { pct: 1, done: true }; saveMeta(); persist();
  sound.finish();
  setTimeout(() => {
    if (current !== art) return;
    $('fPreview').src = board.exportCanvas(520).toDataURL('image/png');
    $('fText').textContent = `${art.title} is complete. Take a moment with it.`;
    const next = ARTS[(ARTS.indexOf(art) + 1) % ARTS.length];
    $('fNext').textContent = next === art ? 'Back to the gallery' : `Next: ${next.title}`;
    $('fNext').onclick = () => { $('finale').hidden = true; next === art ? go('#/') : go(`#/art/${next.id}`); };
    $('finale').hidden = false;
  }, 900);
}
$('fClose').onclick = () => { $('finale').hidden = true; };
$('fGallery').onclick = () => { $('finale').hidden = true; go('#/'); };
$('done').onclick = () => $('back').onclick();
$('fSave').onclick = () => {
  board.exportCanvas(1800).toBlob((b) => {
    if (!b) return; const url = URL.createObjectURL(b), a = document.createElement('a');
    a.href = url; a.download = `calm-colors-${current.id}.png`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  });
};

// ---------------------------------------------------------------- tools
function syncTools() {
  const erase = board.tool === 'erase';
  $('sizes').querySelectorAll('.tool-i[data-size]').forEach((b) => { const on = !erase && +b.dataset.size === board.size; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  $('eraser').classList.toggle('on', erase); $('eraser').setAttribute('aria-pressed', erase); $('eraser').setAttribute('aria-checked', erase);
  $('wrap').classList.toggle('erasing', erase);
}
const TOOLSETS = { color: [[8, 1, 'Fine brush'], [20, 1, 'Medium brush'], [44, 1, 'Broad brush']], free: [[4, 1, 'Pen'], [14, 1, 'Brush'], [30, 0.4, 'Marker']] };
function applyToolset(mode, pickIdx) {
  $('sizes').querySelectorAll('.tool-i[data-size]').forEach((b, i) => { const [s, a, l] = TOOLSETS[mode][i]; b.dataset.size = s; b.dataset.alpha = a; b.setAttribute('aria-label', l); });
  const d = TOOLSETS[mode][pickIdx]; board.size = d[0]; board.alpha = d[1]; board.tool = 'brush'; syncTools();
}
function setTool(t) { board.tool = t; syncTools(); }
function setSize(v) { board.size = v; syncTools(); }
$('sizes').addEventListener('click', (e) => {
  const b = e.target.closest('.tool-i'); if (!b) return;
  if (b.id === 'eraser') { if (current && current.free) board.size = 28; setTool('erase'); } else { board.size = +b.dataset.size; board.alpha = +b.dataset.alpha || 1; setTool('brush'); }
});
$('undo').onclick = () => board.undo();
$('redo').onclick = () => board.redo();
$('guide').onclick = (e) => { board.guide = !board.guide; e.currentTarget.classList.toggle('on', board.guide); e.currentTarget.setAttribute('aria-pressed', board.guide); board.drawLabels(); };
$('inside').onclick = (e) => {
  board.inside = !board.inside; e.currentTarget.classList.toggle('on', board.inside); e.currentTarget.setAttribute('aria-pressed', board.inside);
  note(board.inside ? 'Stay in lines: strokes stop at the edge of the section you start in.' : 'Free hand: color can spill over the lines, just like paper.');
};
setSize(20);

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
let zoom = 1, panTool = false, space = false, pinch = null, panning = null, layoutTimer = 0;
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
let zoomRaf = 0;
function tweenZoom(target, vx, vy, ux, uy) {            // eased zoom for the buttons and keys (wheel and pinch stay direct)
  cancelAnimationFrame(zoomRaf);
  const u = ux == null ? contentPoint(vx, vy) : { x: ux, y: uy }, z0 = zoom, z1 = clampZ(target), t0 = performance.now(), D = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
  const step = (now) => {
    const k = D ? Math.min(1, (now - t0) / D) : 1, e = 1 - Math.pow(1 - k, 3);
    applyZoom(z0 + (z1 - z0) * e, u.x, u.y, vx, vy);
    if (k < 1) zoomRaf = requestAnimationFrame(step);
  };
  zoomRaf = requestAnimationFrame(step);
}
$('zIn').onclick = () => tweenZoom(zoom * 1.5, ...mid());
$('zOut').onclick = () => tweenZoom(zoom / 1.5, ...mid());
$('zFit').onclick = () => tweenZoom(1, ...mid(), 0.5, 0.5);
viewport.addEventListener('wheel', (e) => { e.preventDefault(); const r = vpRect(); zoomAt(Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top); }, { passive: false });

const syncPan = () => { const on = panTool || space; viewport.classList.toggle('panning', on); if (on) cursor.hidden = true; };
$('pan').onclick = (e) => { panTool = !panTool; e.currentTarget.classList.toggle('on', panTool); e.currentTarget.setAttribute('aria-pressed', panTool); syncPan(); if (panTool && zoom === 1) note('Zoom in with + or pinch, then drag to move around.'); };

function moveCursor(e) {
  if (e.pointerType !== 'mouse' || panTool || space) { cursor.hidden = true; return; }
  const r = wrap.getBoundingClientRect(), z = els.zoom.getBoundingClientRect(), d = (board.size / W) * z.width;
  cursor.hidden = false; cursor.style.width = cursor.style.height = `${d}px`;
  cursor.style.transform = `translate(${e.clientX - r.left - d / 2}px, ${e.clientY - r.top - d / 2}px)`;
  cursor.style.setProperty('--c', board.tool === 'erase' ? '#8a8f8b' : (board.colors && board.colors[board.color]) || '#26302b');
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
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? board.redo() : board.undo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); board.redo(); return; }
  if (e.key === ' ') { e.preventDefault(); if (!space) { space = true; syncPan(); } return; }
  if (e.key === '+' || e.key === '=') { tweenZoom(zoom * 1.4, ...mid()); return; }
  if (e.key === '-' || e.key === '_') { tweenZoom(zoom / 1.4, ...mid()); return; }
  if (/^[0-9]$/.test(k)) { const n = k === '0' ? 10 : +k; if (current.palette.some((p) => p.n === n)) pick(n); }
  else if (k === 'e') setTool(board.tool === 'erase' ? 'brush' : 'erase');
  else if (k === 'b') setTool('brush');
  else if (k === '[' || k === ']') { const bs = [...$('sizes').querySelectorAll('.tool-i[data-size]')], i = bs.findIndex((b) => +b.dataset.size === board.size), nb = bs[Math.max(0, Math.min(2, (i < 0 ? 1 : i) + (k === ']' ? 1 : -1)))]; board.size = +nb.dataset.size; board.alpha = +nb.dataset.alpha || 1; setTool('brush'); }
});

addEventListener('keyup', (e) => { if (e.key === ' ' && space) { space = false; syncPan(); } });

// ---------------------------------------------------------------- routing
function show(view) {
  document.body.dataset.view = view;
  $('gallery').hidden = view !== 'gallery'; $('studio').hidden = view !== 'studio';
  window.scrollTo(0, 0);
}
function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
const pendingTitles = {};
function route() {
  const h = location.hash; let mm;
  if ((mm = h.match(/^#\/draw\/([\w-]+)/))) {
    if (mm[1] === 'new') {
      const id = 'd' + Date.now().toString(36); pendingTitles[id] = `Drawing ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
      location.replace(`#/draw/${id}`); return;
    }
    const a = freeArt(mm[1]); if (pendingTitles[mm[1]]) a.title = pendingTitles[mm[1]];
    open(a); return;
  }
  const art = (mm = h.match(/^#\/art\/([\w-]+)/)) && byId(mm[1]);
  if (art) open(art); else { current = null; tab = h.startsWith('#/free') ? 'free' : 'color'; buildGallery(); show('gallery'); $('finale').hidden = true; }
}
const more = $('more'), moreBtn = $('moreBtn');
const isOpen = () => more.classList.contains('open');
const closeMore = () => { more.classList.remove('open'); moreBtn.setAttribute('aria-expanded', 'false'); };
moreBtn.onclick = (e) => { e.stopPropagation(); more.classList.toggle('open'); moreBtn.setAttribute('aria-expanded', String(isOpen())); };
document.addEventListener('pointerdown', (e) => { if (isOpen() && !more.contains(e.target) && !moreBtn.contains(e.target)) closeMore(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMore(); });
$('back').onclick = async () => { clearTimeout(saveTimer); const free = current && current.free; if (current) await persist(); go(free ? '#/free' : '#/'); };
addEventListener('hashchange', route);
let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (current) { applyZoom(zoom, 0.5, 0.5, ...mid()); } }, 120); });
document.fonts?.ready.then(() => { if (current) board.drawLabels(); });
window.__calm = { board, ARTS };
route();
