import { W, PAPER, strokeItems, pathOf } from './render.js';

const PS = 2, P = W * PS;                       // the paint layer is 1600 x 1600 so strokes stay sharp when zoomed
const GRID = 0.5, S = Math.round(W * GRID);     // analysis grid (400 x 400)
const DONE_AT = 0.9;                            // a section counts as coloured when this much of it carries the right colour
const UNDONE_AT = 0.82;                         // ...and stops counting if painted over below this
const FONT = '"DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
const mk = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rgbOf = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const rule = (r) => (r.eo ? 'evenodd' : 'nonzero');

export class Board {
  constructor(els, hooks = {}) {
    this.els = els; this.hooks = hooks;
    els.paint.width = els.paint.height = P;
    this.pctx = els.paint.getContext('2d');
    this.tmp = mk(P); this.tctx = this.tmp.getContext('2d');          // one stroke segment before it lands on the paint layer
    this.scratch = mk(S); this.sctx = this.scratch.getContext('2d', { willReadFrequently: true });
    this.hitCtx = mk(1).getContext('2d');
    this.hl = mk(S); this.hlctx = this.hl.getContext('2d');           // soft highlight of the sections that match the chosen colour
    this.color = 1; this.size = 24; this.tool = 'brush'; this.inside = false; this.guide = true;
    this.maskCache = new Map(); this.hist = []; this.stroke = null; this.pulse = 0; this.flashes = []; this.regions = []; this.wasAll = false;
  }

  // ---------- loading ----------
  async load(art, saved) {
    this.art = art; this.maskCache.clear(); this.hist = []; this.flashes = []; this.stroke = null;
    this.colors = {}; this.rgb = {};
    art.palette.forEach((p) => { this.colors[p.n] = p.hex; this.rgb[p.n] = rgbOf(p.hex); });
    this.regions = [];
    art.items.forEach((it) => { if (!it.line) this.regions.push({ n: it.n, path: pathOf(it), eo: !!it.eo, done: false, order: this.regions.length }); });
    this.analyse();
    this.pctx.setTransform(1, 0, 0, 1, 0, 0); this.pctx.clearRect(0, 0, P, P);
    if (saved) { try { await this.restore(saved); } catch (e) { /* ignore a broken save */ } }
    const open = this.regions.find((r) => !r.done && !r.hidden);
    this.color = open ? open.n : art.palette[0].n;
    this.wasAll = this.stats().allDone;
    this.layout(); this.buildHighlight(); this.drawLabels(); this.emit();
  }

  // For every section: which pixels are actually visible (not covered by a section above it), a grid of sample points,
  // and the best spot for its number (the middle of the largest circle that fits).
  analyse() {
    const sc = this.sctx, regs = this.regions;
    regs.forEach((r, k) => {
      sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, S, S);
      sc.setTransform(GRID, 0, 0, GRID, 0, 0);
      sc.globalCompositeOperation = 'source-over'; sc.fillStyle = '#000';
      sc.fill(r.path, rule(r));
      sc.globalCompositeOperation = 'destination-out';
      for (let j = k + 1; j < regs.length; j++) sc.fill(regs[j].path, rule(regs[j]));
      sc.globalCompositeOperation = 'source-over';
      const data = sc.getImageData(0, 0, S, S).data;
      const m = new Uint8Array(S * S), xs = []; let cells = 0;
      for (let i = 0; i < S * S; i++) if (data[i * 4 + 3] > 127) { m[i] = 1; cells++; }
      const step = cells < 2500 ? 1 : cells < 20000 ? 2 : 3;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < S; y += step) for (let x = 0; x < S; x += step) if (m[y * S + x]) {
        const ux = (x + 0.5) / GRID, uy = (y + 0.5) / GRID; xs.push(ux, uy);
        if (ux < x0) x0 = ux; if (ux > x1) x1 = ux; if (uy < y0) y0 = uy; if (uy > y1) y1 = uy;
      }
      r.mask = m; r.pts = new Float32Array(xs); r.col = new Uint8Array(xs.length / 2);
      r.total = r.col.length; r.count = 0; r.bbox = [x0, y0, x1, y1];
      if (r.total < 8) { r.hidden = true; r.done = true; r.total = 0; return; }
      // distance transform (chamfer) -> label position
      const d = new Float32Array(S * S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const i = y * S + x; if (!m[i]) continue; let v = 1e9;
        if (x === 0 || y === 0 || x === S - 1 || y === S - 1) v = 1;
        if (x > 0) v = Math.min(v, d[i - 1] + 1);
        if (y > 0) { v = Math.min(v, d[i - S] + 1); if (x > 0) v = Math.min(v, d[i - S - 1] + 1.414); if (x < S - 1) v = Math.min(v, d[i - S + 1] + 1.414); }
        d[i] = v;
      }
      let best = 0, bx = 0, by = 0;
      for (let y = S - 1; y >= 0; y--) for (let x = S - 1; x >= 0; x--) {
        const i = y * S + x; if (!m[i]) continue; let v = d[i];
        if (x < S - 1) v = Math.min(v, d[i + 1] + 1);
        if (y < S - 1) { v = Math.min(v, d[i + S] + 1); if (x < S - 1) v = Math.min(v, d[i + S + 1] + 1.414); if (x > 0) v = Math.min(v, d[i + S - 1] + 1.414); }
        d[i] = v; if (v > best) { best = v; bx = x; by = y; }
      }
      r.lx = (bx + 0.5) / GRID; r.ly = (by + 0.5) / GRID; r.lr = best / GRID;
    });
  }

  // Rebuild what each section holds from a saved picture: the nearest palette colour under every sample point.
  async restore(src) {
    const img = await loadImg(src);
    this.pctx.setTransform(1, 0, 0, 1, 0, 0); this.pctx.clearRect(0, 0, P, P); this.pctx.drawImage(img, 0, 0, P, P);
    const id = this.pctx.getImageData(0, 0, P, P).data, pal = Object.keys(this.rgb).map(Number);
    for (const r of this.regions) {
      if (r.hidden) continue; let c = 0;
      for (let k = 0; k < r.total; k++) {
        const o = (Math.floor(r.pts[k * 2 + 1] * PS) * P + Math.floor(r.pts[k * 2] * PS)) * 4;
        let v = 0;
        if (id[o + 3] > 160) {
          v = 255; let bd = 90;
          for (const n of pal) { const t = this.rgb[n], dd = Math.abs(id[o] - t[0]) + Math.abs(id[o + 1] - t[1]) + Math.abs(id[o + 2] - t[2]); if (dd < bd) { bd = dd; v = n; } }
        }
        r.col[k] = v; if (v === r.n) c++;
      }
      r.count = c; r.done = c / r.total >= DONE_AT;
    }
  }

  // ---------- masks (only used by the optional "Stay in lines" assist) ----------
  getMask(r) {
    let m = this.maskCache.get(r);
    if (m) { this.maskCache.delete(r); this.maskCache.set(r, m); return m; }
    m = mk(P); const g = m.getContext('2d'); g.setTransform(PS, 0, 0, PS, 0, 0);
    g.fillStyle = '#000'; g.fill(r.path, rule(r));
    g.globalCompositeOperation = 'destination-out';
    for (let j = r.order + 1; j < this.regions.length; j++) g.fill(this.regions[j].path, rule(this.regions[j]));
    this.maskCache.set(r, m);
    if (this.maskCache.size > 3) this.maskCache.delete(this.maskCache.keys().next().value);
    return m;
  }

  hit(x, y) {
    for (let k = this.regions.length - 1; k >= 0; k--) { const r = this.regions[k]; if (!r.hidden && this.hitCtx.isPointInPath(r.path, x, y, rule(r))) return r; }
    return null;
  }

  // ---------- layout & overlays ----------
  layout() {
    const box = this.els.zoom.getBoundingClientRect();
    if (!box.width) return;
    this.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const px = Math.min(4096, Math.round(box.width * this.dpr));
    this.cssPerUnit = box.width / W;
    for (const c of [this.els.lines, this.els.labels]) { c.width = px; c.height = px; }
    strokeItems(this.els.lines.getContext('2d'), this.art.items, px / W, 1);
    this.drawLabels();
  }

  buildHighlight() {
    const g = this.hlctx; g.clearRect(0, 0, S, S);
    const img = g.createImageData(S, S), o = img.data;
    for (const r of this.regions) {
      if (r.hidden || r.done || r.n !== this.color) continue;
      for (let i = 0; i < S * S; i++) if (r.mask[i]) { o[i * 4] = 214; o[i * 4 + 1] = 160; o[i * 4 + 2] = 62; o[i * 4 + 3] = 255; }
    }
    g.putImageData(img, 0, 0);
  }

  drawLabels() {
    const c = this.els.labels, px = c.width; if (!px) return;
    const g = c.getContext('2d'), s = px / W;
    g.clearRect(0, 0, px, px);
    if (this.guide) { g.globalAlpha = Math.min(0.5, 0.13 + this.pulse * 0.3); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(this.hl, 0, 0, px, px); g.globalAlpha = 1; }
    for (const f of this.flashes) { g.globalAlpha = f.a; g.drawImage(f.c, 0, 0, px, px); }
    g.globalAlpha = 1; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    for (const r of this.regions) {
      if (r.done || r.hidden) continue;
      const size = Math.min(15, r.lr * 0.95);
      if (size * (this.cssPerUnit || 0.75) < 6) continue;   // too small to read at this zoom, shown once zoomed in
      const cur = r.n === this.color;
      g.font = `${cur ? 700 : 500} ${size * s}px ${FONT}`;
      g.lineWidth = 2.6 * s; g.strokeStyle = 'rgba(255,254,251,0.85)'; g.strokeText(String(r.n), r.lx * s, r.ly * s);
      g.fillStyle = cur ? '#c2261c' : '#d4473c'; g.fillText(String(r.n), r.lx * s, r.ly * s);
    }
  }

  animate() {
    if (this.raf) return;
    const step = (now) => {
      this.pulse = this.pulseUntil > now ? Math.sin(((this.pulseUntil - now) / 900) * Math.PI) : 0;
      this.flashes = this.flashes.filter((f) => { f.a = 0.6 * (1 - (now - f.t) / 600); return f.a > 0; });
      this.drawLabels();
      if (this.flashes.length || this.pulseUntil > now) this.raf = requestAnimationFrame(step); else { this.raf = 0; this.pulse = 0; this.drawLabels(); }
    };
    this.raf = requestAnimationFrame(step);
  }
  flash(r) {
    const c = mk(S), g = c.getContext('2d'), img = g.createImageData(S, S);
    for (let i = 0; i < S * S; i++) if (r.mask[i]) { img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    this.flashes.push({ c, a: 0.6, t: performance.now() }); this.animate();
  }

  // ---------- settings ----------
  setColor(n) { this.color = n; this.buildHighlight(); this.pulseUntil = performance.now() + 900; this.animate(); }
  setGuide(on) { this.guide = on; this.drawLabels(); }

  // ---------- painting ----------
  toUnits(cx, cy) { const b = this.els.zoom.getBoundingClientRect(); return [((cx - b.left) / b.width) * W, ((cy - b.top) / b.height) * W]; }

  down(x, y, pressure = 0.5, pen = false) {
    const r0 = this.hit(x, y);
    const s = { lx: x, ly: y, pen, region: null, mask: null, touched: new Set(), colBefore: new Map(), doneBefore: new Map(), dirty: null, before: null, checked: performance.now() };
    if (this.inside) {                                   // optional assist: the stroke stays inside the section it started in
      if (!r0) { this.stroke = null; return; }
      s.region = r0; s.mask = this.getMask(r0);
    }
    this.stroke = s;
    if (this.tool === 'brush' && r0 && r0.n !== this.color) this.hooks.mismatch?.(r0);
    this.seg(x, y, x, y, pressure);
  }
  move(x, y, pressure = 0.5) {
    const s = this.stroke; if (!s) return;
    this.seg(s.lx, s.ly, x, y, pressure); s.lx = x; s.ly = y;
    const now = performance.now();
    if (now - s.checked > 320 && s.touched.size) { s.checked = now; this.review(s.touched); }
  }
  up() {
    const s = this.stroke; this.stroke = null; if (!s || !s.before) return;
    this.review(s.touched);
    this.commit(s);
    const st = this.stats();
    if (st.allDone && !this.wasAll) { this.wasAll = true; this.hooks.finished?.(); } else if (!st.allDone) this.wasAll = false;
    this.hooks.changed?.();
  }

  seg(x0, y0, x1, y1, pressure) {
    const s = this.stroke, erase = this.tool === 'erase';
    let size = this.size; if (s.pen) size *= 0.65 + pressure * 0.7;
    const r = size / 2, pad = r + 2;
    let bx = Math.floor((Math.min(x0, x1) - pad) * PS), by = Math.floor((Math.min(y0, y1) - pad) * PS);
    let bw = Math.ceil((Math.abs(x1 - x0) + pad * 2) * PS) + 2, bh = Math.ceil((Math.abs(y1 - y0) + pad * 2) * PS) + 2;
    bx = Math.max(0, bx); by = Math.max(0, by); bw = Math.min(P - bx, bw); bh = Math.min(P - by, bh);
    if (bw <= 0 || bh <= 0) return;
    if (!s.before) { s.before = mk(P); s.before.getContext('2d').drawImage(this.els.paint, 0, 0); }   // for undo
    const d = s.dirty;
    s.dirty = d ? { x0: Math.min(d.x0, bx), y0: Math.min(d.y0, by), x1: Math.max(d.x1, bx + bw), y1: Math.max(d.y1, by + bh) } : { x0: bx, y0: by, x1: bx + bw, y1: by + bh };
    const t = this.tctx;
    t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(bx, by, bw, bh);
    t.save(); t.beginPath(); t.rect(bx, by, bw, bh); t.clip();
    t.setTransform(PS, 0, 0, PS, 0, 0);
    t.strokeStyle = erase ? '#000' : this.colors[this.color];
    t.lineWidth = size; t.lineCap = 'round'; t.lineJoin = 'round';
    t.beginPath(); t.moveTo(x0, y0); t.lineTo(x1 + 0.01, y1 + 0.01); t.stroke(); t.restore();
    if (s.mask) { t.globalCompositeOperation = 'destination-in'; t.drawImage(s.mask, bx, by, bw, bh, bx, by, bw, bh); t.globalCompositeOperation = 'source-over'; }
    const p = this.pctx; p.setTransform(1, 0, 0, 1, 0, 0);
    p.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    p.drawImage(this.tmp, bx, by, bw, bh, bx, by, bw, bh);
    p.globalCompositeOperation = 'source-over';
    // bookkeeping along the segment: what colour each sample point now carries
    const dist = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(dist / (r * 0.6)));
    for (let i = 0; i <= n; i++) this.stamp(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, r * 0.94, erase);
  }

  stamp(cx, cy, rr, erase) {
    const s = this.stroke, val = erase ? 0 : this.color, list = s.region ? [s.region] : this.regions, r2 = rr * rr;
    for (const reg of list) {
      if (reg.hidden) continue;
      const b = reg.bbox; if (cx + rr < b[0] || cx - rr > b[2] || cy + rr < b[1] || cy - rr > b[3]) continue;
      const p = reg.pts, col = reg.col; let ch = 0;
      for (let k = 0, j = 0; k < col.length; k++, j += 2) {
        const dx = p[j] - cx, dy = p[j + 1] - cy;
        if (dx * dx + dy * dy <= r2 && col[k] !== val) {
          if (!s.colBefore.has(reg)) { s.colBefore.set(reg, col.slice()); s.doneBefore.set(reg, reg.done); }
          const was = col[k] === reg.n, now = val === reg.n; col[k] = val;
          if (was !== now) reg.count += now ? 1 : -1;
          ch++;
        }
      }
      if (ch) s.touched.add(reg);
    }
  }

  // A section counts as coloured once enough of it carries its own colour. Nothing is tidied up or redrawn:
  // what you painted stays exactly as you painted it, spills included.
  review(touched) {
    let changed = false;
    for (const reg of touched) {
      const ratio = reg.count / reg.total;
      if (!reg.done && ratio >= DONE_AT) { reg.done = true; changed = true; this.flash(reg); this.hooks.regionDone?.(reg); }
      else if (reg.done && ratio < UNDONE_AT) { reg.done = false; changed = true; }
    }
    touched.clear();
    if (changed) { this.buildHighlight(); this.drawLabels(); }
    this.hooks.progress?.(this.stats());
  }

  // ---------- history ----------
  commit(s) {
    const d = s.dirty; if (!d) return;
    const w = d.x1 - d.x0, h = d.y1 - d.y0, c = mk(w, h);
    c.getContext('2d').drawImage(s.before, d.x0, d.y0, w, h, 0, 0, w, h);
    this.hist.push({ x: d.x0, y: d.y0, c, cols: s.colBefore, done: s.doneBefore });
    if (this.hist.length > 14) this.hist.shift();
    s.before = null;
    this.hooks.history?.(this.hist.length);
  }
  undo() {
    const h = this.hist.pop(); if (!h) return;
    const p = this.pctx; p.setTransform(1, 0, 0, 1, 0, 0); p.globalCompositeOperation = 'source-over';
    p.clearRect(h.x, h.y, h.c.width, h.c.height); p.drawImage(h.c, h.x, h.y);
    for (const [reg, col] of h.cols) {
      reg.col = col; let c = 0; for (let k = 0; k < col.length; k++) if (col[k] === reg.n) c++;
      reg.count = c; reg.done = h.done.get(reg);
    }
    this.wasAll = this.stats().allDone;
    this.buildHighlight(); this.drawLabels();
    this.hooks.history?.(this.hist.length); this.hooks.progress?.(this.stats()); this.hooks.changed?.();
  }
  reset() {
    this.pctx.setTransform(1, 0, 0, 1, 0, 0); this.pctx.clearRect(0, 0, P, P); this.hist = []; this.wasAll = false;
    for (const r of this.regions) { if (r.hidden) continue; r.col.fill(0); r.count = 0; r.done = false; }
    this.buildHighlight(); this.drawLabels(); this.hooks.history?.(0); this.hooks.progress?.(this.stats()); this.hooks.changed?.();
  }

  // ---------- stats & export ----------
  stats() {
    let num = 0, den = 0, left = 0; const per = {};
    for (const r of this.regions) {
      if (r.hidden) continue;
      den += r.total; num += r.done ? r.total : Math.min(r.count, r.total);
      const e = per[r.n] || (per[r.n] = { total: 0, left: 0 }); e.total++; if (!r.done) { e.left++; left++; }
    }
    return { pct: den ? num / den : 0, per, allDone: left === 0 && den > 0 };
  }
  emit() { this.hooks.progress?.(this.stats()); this.hooks.history?.(this.hist.length); }
  hasPaint() { return this.regions.some((r) => !r.hidden && r.col.some((v) => v)); }
  toBlob() { return new Promise((res) => this.els.paint.toBlob(res, 'image/png')); }
  exportCanvas(size = 1800) {
    const c = mk(size), g = c.getContext('2d');
    g.fillStyle = PAPER; g.fillRect(0, 0, size, size);
    g.imageSmoothingQuality = 'high'; g.drawImage(this.els.paint, 0, 0, size, size);
    const l = mk(size); strokeItems(l.getContext('2d'), this.art.items, size / W, 1); g.drawImage(l, 0, 0);
    return c;
  }
}
