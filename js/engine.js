import { W, PAPER, strokeItems, pathOf } from './render.js';

const GRID = 0.4, S = Math.round(W * GRID);   // low-res analysis grid (320 x 320)
const DONE_AT = 0.93;                          // a section completes (and snaps to a clean fill) at this coverage
const FONT = '"Nunito", system-ui, -apple-system, "Segoe UI", sans-serif';
const mk = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rgbOf = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const rule = (r) => (r.eo ? 'evenodd' : 'nonzero');

export class Board {
  constructor(els, hooks = {}) {
    this.els = els; this.hooks = hooks;
    this.pctx = els.paint.getContext('2d');
    this.tmp = mk(W); this.tctx = this.tmp.getContext('2d');          // one stroke segment, clipped, before it lands on the paint layer
    this.lock = mk(W); this.lctx = this.lock.getContext('2d');        // union of finished sections
    this.scratch = mk(S); this.sctx = this.scratch.getContext('2d', { willReadFrequently: true });
    this.hitCtx = mk(1).getContext('2d');
    this.hl = mk(S); this.hlctx = this.hl.getContext('2d');           // soft highlight of the sections that match the chosen colour
    this.color = 1; this.size = 22; this.tool = 'brush'; this.inside = true; this.guide = true;
    this.maskCache = new Map(); this.hist = []; this.stroke = null; this.pulse = 0; this.flashes = []; this.regions = [];
  }

  // ---------- loading ----------
  async load(art, saved) {
    this.art = art; this.maskCache.clear(); this.hist = []; this.flashes = []; this.stroke = null;
    this.colors = {}; this.rgb = {};
    art.palette.forEach((p) => { this.colors[p.n] = p.hex; this.rgb[p.n] = rgbOf(p.hex); });
    this.regions = [];
    art.items.forEach((it) => { if (!it.line) this.regions.push({ n: it.n, path: pathOf(it), eo: !!it.eo, done: false, order: this.regions.length }); });
    this.analyse();
    this.pctx.clearRect(0, 0, W, W); this.lctx.clearRect(0, 0, W, W);
    if (saved) { try { await this.restore(saved); } catch (e) { /* ignore a broken save */ } }
    const open = this.regions.find((r) => !r.done && !r.hidden);
    this.color = open ? open.n : art.palette[0].n;
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
      const m = new Uint8Array(S * S), xs = [];
      for (let i = 0; i < S * S; i++) if (data[i * 4 + 3] > 127) m[i] = 1;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) if (m[y * S + x]) {
        const ux = (x + 0.5) / GRID, uy = (y + 0.5) / GRID; xs.push(ux, uy);
        if (ux < x0) x0 = ux; if (ux > x1) x1 = ux; if (uy < y0) y0 = uy; if (uy > y1) y1 = uy;
      }
      r.mask = m; r.pts = new Float32Array(xs); r.cov = new Uint8Array(xs.length / 2);
      r.total = r.cov.length; r.count = 0; r.bbox = [x0, y0, x1, y1];
      if (r.total < 4) { r.hidden = true; r.done = true; r.total = 0; return; }
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

  async restore(src) {
    const img = await loadImg(src);
    this.pctx.drawImage(img, 0, 0, W, W);
    const id = this.pctx.getImageData(0, 0, W, W).data;
    for (const r of this.regions) {
      if (r.hidden) continue;
      const t = this.rgb[r.n]; let c = 0;
      for (let k = 0; k < r.total; k++) {
        const o = ((r.pts[k * 2 + 1] | 0) * W + (r.pts[k * 2] | 0)) * 4;
        const ok = id[o + 3] > 200 && Math.abs(id[o] - t[0]) + Math.abs(id[o + 1] - t[1]) + Math.abs(id[o + 2] - t[2]) < 60;
        r.cov[k] = ok ? 1 : 0; c += ok ? 1 : 0;
      }
      r.count = c;
      if (c / r.total >= DONE_AT) { r.done = true; r.cov.fill(1); r.count = r.total; }
    }
    this.rebuildLock();
  }

  // ---------- masks ----------
  getMask(r) {
    let m = this.maskCache.get(r);
    if (m) { this.maskCache.delete(r); this.maskCache.set(r, m); return m; }
    m = mk(W); const g = m.getContext('2d');
    g.fillStyle = '#000'; g.fill(r.path, rule(r));
    g.globalCompositeOperation = 'destination-out';
    for (let j = r.order + 1; j < this.regions.length; j++) g.fill(this.regions[j].path, rule(this.regions[j]));
    this.maskCache.set(r, m);
    if (this.maskCache.size > 6) this.maskCache.delete(this.maskCache.keys().next().value);
    return m;
  }
  rebuildLock() { this.lctx.clearRect(0, 0, W, W); for (const r of this.regions) if (r.done && !r.hidden) this.lctx.drawImage(this.getMask(r), 0, 0); }

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
    strokeItems(this.els.lines.getContext('2d'), this.art.items, px / W, 1.1);
    this.drawLabels();
  }

  buildHighlight() {
    const g = this.hlctx; g.clearRect(0, 0, S, S);
    const img = g.createImageData(S, S), o = img.data;
    for (const r of this.regions) {
      if (r.hidden || r.done || r.n !== this.color) continue;
      for (let i = 0; i < S * S; i++) if (r.mask[i]) { o[i * 4] = 255; o[i * 4 + 1] = 168; o[i * 4 + 2] = 30; o[i * 4 + 3] = 255; }
    }
    g.putImageData(img, 0, 0);
  }

  drawLabels() {
    const c = this.els.labels, px = c.width; if (!px) return;
    const g = c.getContext('2d'), s = px / W;
    g.clearRect(0, 0, px, px);
    if (this.guide) { g.globalAlpha = Math.min(0.5, 0.11 + this.pulse * 0.32); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(this.hl, 0, 0, px, px); g.globalAlpha = 1; }
    for (const f of this.flashes) { g.globalAlpha = f.a; g.drawImage(f.c, 0, 0, px, px); }
    g.globalAlpha = 1; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    for (const r of this.regions) {
      if (r.done || r.hidden) continue;
      const size = Math.min(27, r.lr * 0.95);
      if (size * (this.cssPerUnit || 0.75) < 8) continue;   // too small to read at this zoom, shown once zoomed in
      g.font = `800 ${size * s}px ${FONT}`;
      g.lineWidth = 4 * s; g.strokeStyle = 'rgba(255,253,248,0.94)'; g.strokeText(String(r.n), r.lx * s, r.ly * s);
      g.fillStyle = r.n === this.color ? '#b8430c' : '#4f4a58'; g.fillText(String(r.n), r.lx * s, r.ly * s);
    }
  }

  animate() {
    if (this.raf) return;
    const t0 = performance.now();
    const step = (now) => {
      const age = now - t0;
      this.pulse = this.pulseUntil > now ? Math.sin(((this.pulseUntil - now) / 900) * Math.PI) : 0;
      this.flashes = this.flashes.filter((f) => { f.a = 0.75 * (1 - (now - f.t) / 520); return f.a > 0; });
      this.drawLabels();
      if (this.flashes.length || this.pulseUntil > now) this.raf = requestAnimationFrame(step); else { this.raf = 0; this.pulse = 0; this.drawLabels(); }
    };
    this.raf = requestAnimationFrame(step);
  }
  flash(r) {
    const c = mk(S), g = c.getContext('2d'), img = g.createImageData(S, S);
    for (let i = 0; i < S * S; i++) if (r.mask[i]) { img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    this.flashes.push({ c, a: 0.75, t: performance.now() }); this.animate();
  }

  // ---------- settings ----------
  setColor(n) { this.color = n; this.buildHighlight(); this.pulseUntil = performance.now() + 900; this.animate(); }
  setGuide(on) { this.guide = on; this.drawLabels(); }

  // ---------- painting ----------
  toUnits(cx, cy) { const b = this.els.zoom.getBoundingClientRect(); return [((cx - b.left) / b.width) * W, ((cy - b.top) / b.height) * W]; }

  down(x, y, pressure = 0.5, pen = false) {
    const r0 = this.hit(x, y);
    const s = { region: this.inside ? r0 : null, lx: x, ly: y, snapped: false, pen, touched: new Set() };
    if (this.inside) {
      if (!r0) { this.stroke = null; return; }
      if (this.tool === 'brush' && r0.done) { this.stroke = null; this.hooks.locked?.(r0); return; }
      s.mask = this.getMask(r0);
    }
    this.stroke = s;
    if (this.tool === 'brush' && r0 && !r0.done && r0.n !== this.color) this.hooks.mismatch?.(r0);
    this.seg(x, y, x, y, pressure);
  }
  move(x, y, pressure = 0.5) { const s = this.stroke; if (!s) return; this.seg(s.lx, s.ly, x, y, pressure); s.lx = x; s.ly = y; }
  up() {
    const s = this.stroke; this.stroke = null; if (!s) return;
    if (s.snapped) { this.checkDone(s); this.hooks.changed?.(); }
  }

  seg(x0, y0, x1, y1, pressure) {
    const s = this.stroke, erase = this.tool === 'erase';
    let size = this.size; if (s.pen) size *= 0.65 + pressure * 0.7;
    const r = size / 2, pad = size + 3;
    let bx = Math.floor(Math.min(x0, x1) - pad), by = Math.floor(Math.min(y0, y1) - pad);
    let bw = Math.ceil(Math.abs(x1 - x0) + pad * 2), bh = Math.ceil(Math.abs(y1 - y0) + pad * 2);
    bx = Math.max(0, bx); by = Math.max(0, by); bw = Math.min(W - bx, bw); bh = Math.min(W - by, bh);
    if (bw <= 0 || bh <= 0) return;
    if (!s.snapped) { this.snapshot(); s.snapped = true; }
    const t = this.tctx;
    t.globalCompositeOperation = 'source-over'; t.clearRect(bx, by, bw, bh);
    t.save(); t.beginPath(); t.rect(bx, by, bw, bh); t.clip();
    t.strokeStyle = t.fillStyle = erase ? '#000' : this.colors[this.color];
    t.lineWidth = size; t.lineCap = 'round'; t.lineJoin = 'round';
    t.beginPath(); t.moveTo(x0, y0); t.lineTo(x1 + 0.01, y1 + 0.01); t.stroke(); t.restore();
    t.globalCompositeOperation = 'destination-in';
    if (s.mask) t.drawImage(s.mask, bx, by, bw, bh, bx, by, bw, bh);
    t.globalCompositeOperation = 'source-over';
    if (!s.mask) { t.globalCompositeOperation = 'destination-out'; t.drawImage(this.lock, bx, by, bw, bh, bx, by, bw, bh); t.globalCompositeOperation = 'source-over'; }
    this.pctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    this.pctx.drawImage(this.tmp, bx, by, bw, bh, bx, by, bw, bh);
    this.pctx.globalCompositeOperation = 'source-over';
    // coverage bookkeeping along the segment
    const dist = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(dist / (r * 0.6)));
    for (let i = 0; i <= n; i++) this.stamp(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, r * 0.94, erase);
  }

  stamp(cx, cy, rr, erase) {
    const s = this.stroke, list = this.inside ? [s.region] : this.regions;
    for (const reg of list) {
      if (!reg || reg.hidden) continue;
      const b = reg.bbox; if (cx + rr < b[0] || cx - rr > b[2] || cy + rr < b[1] || cy - rr > b[3]) continue;
      if (reg.done) { if (!erase || !this.inside) continue; this.unlock(reg); }
      const val = !erase && reg.n === this.color ? 1 : 0, p = reg.pts, cov = reg.cov, r2 = rr * rr; let ch = 0;
      for (let k = 0, j = 0; k < cov.length; k++, j += 2) {
        const dx = p[j] - cx, dy = p[j + 1] - cy;
        if (dx * dx + dy * dy <= r2 && cov[k] !== val) { cov[k] = val; reg.count += val ? 1 : -1; ch++; }
      }
      if (ch && val) s.touched.add(reg);
    }
  }
  unlock(reg) { reg.done = false; reg.cov.fill(1); reg.count = reg.total; this.rebuildLock(); this.drawLabels(); this.buildHighlight(); this.hooks.progress?.(this.stats()); }

  checkDone(s) {
    let any = false;
    for (const reg of s.touched) if (!reg.done && reg.count / reg.total >= DONE_AT) { this.complete(reg); any = true; }
    if (any) { this.buildHighlight(); this.drawLabels(); const st = this.stats(); this.hooks.progress?.(st); if (st.allDone) this.hooks.finished?.(); } else this.hooks.progress?.(this.stats());
  }
  complete(reg) {
    const t = this.tctx; t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, W, W);
    t.fillStyle = this.colors[reg.n]; t.fillRect(0, 0, W, W);
    t.globalCompositeOperation = 'destination-in'; t.drawImage(this.getMask(reg), 0, 0); t.globalCompositeOperation = 'source-over';
    this.pctx.globalCompositeOperation = 'source-over'; this.pctx.drawImage(this.tmp, 0, 0);
    reg.done = true; reg.cov.fill(1); reg.count = reg.total;
    this.lctx.drawImage(this.getMask(reg), 0, 0);
    this.flash(reg); this.hooks.regionDone?.(reg);
  }

  // ---------- history ----------
  snapshot() {
    const c = mk(W); c.getContext('2d').drawImage(this.els.paint, 0, 0);
    this.hist.push({ c, cov: this.regions.map((r) => r.cov.slice()), done: this.regions.map((r) => r.done) });
    if (this.hist.length > 10) this.hist.shift();
    this.hooks.history?.(this.hist.length);
  }
  undo() {
    const h = this.hist.pop(); if (!h) return;
    this.pctx.globalCompositeOperation = 'source-over'; this.pctx.clearRect(0, 0, W, W); this.pctx.drawImage(h.c, 0, 0);
    this.regions.forEach((r, i) => { if (r.hidden) return; r.cov = h.cov[i]; r.done = h.done[i]; let c = 0; for (let k = 0; k < r.cov.length; k++) c += r.cov[k]; r.count = c; });
    this.rebuildLock(); this.buildHighlight(); this.drawLabels();
    this.hooks.history?.(this.hist.length); this.hooks.progress?.(this.stats()); this.hooks.changed?.();
  }
  reset() {
    this.pctx.clearRect(0, 0, W, W); this.lctx.clearRect(0, 0, W, W); this.hist = [];
    for (const r of this.regions) { if (r.hidden) continue; r.cov.fill(0); r.count = 0; r.done = false; }
    this.buildHighlight(); this.drawLabels(); this.hooks.history?.(0); this.hooks.progress?.(this.stats()); this.hooks.changed?.();
  }

  // ---------- stats & export ----------
  stats() {
    let num = 0, den = 0; const per = {}; let left = 0;
    for (const r of this.regions) {
      if (r.hidden) continue;
      den += r.total; num += r.done ? r.total : Math.min(r.count, r.total);
      const e = per[r.n] || (per[r.n] = { total: 0, left: 0 }); e.total++; if (!r.done) { e.left++; left++; }
    }
    return { pct: den ? num / den : 0, per, allDone: left === 0 && den > 0 };
  }
  emit() { this.hooks.progress?.(this.stats()); this.hooks.history?.(this.hist.length); }
  dataUrl() { return this.els.paint.toDataURL('image/png'); }
  exportCanvas(size = 1600) {
    const c = mk(size), g = c.getContext('2d');
    g.fillStyle = PAPER; g.fillRect(0, 0, size, size);
    g.imageSmoothingQuality = 'high'; g.drawImage(this.els.paint, 0, 0, size, size);
    const l = mk(size); strokeItems(l.getContext('2d'), this.art.items, size / W, 1.2); g.drawImage(l, 0, 0);
    return c;
  }
}
