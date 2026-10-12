// Shared helpers for drawing the pictures. Everything works in the 800 x 800 art space.
import { R, Ln, circle, poly, DEG } from '../kit.js';

export const rng = (seed) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const r1 = (n) => Math.round(n * 10) / 10;
const P = (p) => `${r1(p[0])} ${r1(p[1])}`;
const frame = (cx, cy, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return (x, y) => [cx + x * c - y * s, cy + x * s + y * c]; };
export const pol = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];

// one side of a pointed leaf, split along its midrib. side: -1 or 1.  (same outline as kit.petal)
export function leafHalf(cx, cy, ang, len, wid, side, round = 0) {
  const t = frame(cx, cy, ang), tip = len * (1 - round * 0.12), a = 0.7 + round * 0.1;
  return `M${P(t(0, 0))}C${P(t(len * 0.12, side * wid * 1.35))} ${P(t(len * a, side * wid * 1.25))} ${P(t(tip, 0))}Z`;
}
const halfWidth = (u, wid) => wid * 0.95 * Math.pow(Math.sin(Math.PI * Math.min(Math.max(u, 0), 1)), 0.85);

// midrib and side veins of a leaf (detail lines only)
export function leafVeins(cx, cy, ang, len, wid, n = 4, round = 0) {
  const t = frame(cx, cy, ang), tip = len * (1 - round * 0.12);
  let d = `M${P(t(len * 0.03, 0))}L${P(t(tip * 0.94, 0))}`;
  for (let i = 1; i <= n; i++) {
    const u = 0.1 + (0.72 * i) / (n + 1), x = len * u, x2 = Math.min(tip * 0.95, x + len * 0.16), w = halfWidth(x2 / len, wid) * 0.78;
    d += `M${P(t(x, 0))}L${P(t(x2, w))}M${P(t(x, 0))}L${P(t(x2, -w))}`;
  }
  return Ln(d, 1);
}

// a whole leaf: two numbered halves and its veins
export function leaf(cx, cy, ang, len, wid, nA, nB = nA, o = {}) {
  const round = o.round || 0;
  return [R(nA, leafHalf(cx, cy, ang, len, wid, -1, round)), R(nB, leafHalf(cx, cy, ang, len, wid, 1, round)), leafVeins(cx, cy, ang, len, wid, o.veins ?? 3, round)];
}

// pointed petal as one numbered section (plus an optional centre crease)
export function petalR(n, cx, cy, ang, len, wid, round = 0, crease = true) {
  const t = frame(cx, cy, ang), tip = len * (1 - round * 0.12), a = 0.7 + round * 0.1;
  const d = `M${P(t(0, 0))}C${P(t(len * 0.12, -wid * 1.35))} ${P(t(len * a, -wid * 1.25))} ${P(t(tip, 0))}C${P(t(len * a, wid * 1.25))} ${P(t(len * 0.12, wid * 1.35))} ${P(t(0, 0))}Z`;
  const out = [R(n, d)];
  if (crease) out.push(Ln(`M${P(t(len * 0.18, 0))}L${P(t(tip * 0.82, 0))}`, 0.9));
  return out;
}

export function ringD(cx, cy, r0, r1_) { return circle(cx, cy, r1_) + circle(cx, cy, r0); }   // use with { eo: true }
export const ring = (n, cx, cy, r0, r1_) => R(n, ringD(cx, cy, r0, r1_), { eo: true });

export function dots(list, r = 3) { return Ln(list.map(([x, y]) => circle(x, y, r)).join(''), 1); }
export const star4 = (x, y, s) => Ln(`M${x} ${y - s}L${x + s * 0.26} ${y - s * 0.26}L${x + s} ${y}L${x + s * 0.26} ${y + s * 0.26}L${x} ${y + s}L${x - s * 0.26} ${y + s * 0.26}L${x - s} ${y}L${x - s * 0.26} ${y - s * 0.26}Z`, 1.1);

// ---------- geometry for the faceted (stained-glass) pictures ----------
export function inPoly(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const clipHalf = (poly_, si, sj) => {
  const mx = (si[0] + sj[0]) / 2, my = (si[1] + sj[1]) / 2, nx = sj[0] - si[0], ny = sj[1] - si[1];
  const f = (p) => (p[0] - mx) * nx + (p[1] - my) * ny;
  const out = [];
  for (let i = 0; i < poly_.length; i++) {
    const a = poly_[i], b = poly_[(i + 1) % poly_.length], fa = f(a), fb = f(b);
    if (fa <= 0) out.push(a);
    if ((fa <= 0) !== (fb <= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
};
export const area = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; };
export const centroid = (p) => { let x = 0, y = 0, a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length], c = p[i][0] * q[1] - q[0] * p[i][1]; x += (p[i][0] + q[0]) * c; y += (p[i][1] + q[1]) * c; a += c; } a *= 0.5; return a ? [x / (6 * a), y / (6 * a)] : p[0]; };

// Voronoi cells of the seeds, clipped to a polygon. Gives natural stained-glass facets.
export function voronoi(clip, seeds) {
  return seeds.map((s, i) => { let cell = clip; for (let j = 0; j < seeds.length && cell.length > 2; j++) if (j !== i) cell = clipHalf(cell, s, seeds[j]); return cell; });
}
// seeds spread over a polygon (rejection sampling, minimum spacing), relaxed so no cell is a sliver
export function facets(clip, count, seed, relax = 2, margin = 0) {
  const rnd = rng(seed); let xs = Infinity, ys = Infinity, xe = -Infinity, ye = -Infinity;
  clip.forEach(([x, y]) => { xs = Math.min(xs, x); ys = Math.min(ys, y); xe = Math.max(xe, x); ye = Math.max(ye, y); });
  const A = Math.abs(area(clip)); let dmin = Math.sqrt(A / count) * 0.78, seeds = [];
  for (let tries = 0; tries < 6000 && seeds.length < count; tries++) {
    const x = xs + rnd() * (xe - xs), y = ys + rnd() * (ye - ys);
    if (!inPoly(clip, x, y)) continue;
    if (seeds.every((s) => Math.hypot(s[0] - x, s[1] - y) > dmin)) seeds.push([x, y]);
    if (tries % 800 === 799 && seeds.length < count) dmin *= 0.92;
  }
  for (let it = 0; it < relax; it++) seeds = voronoi(clip, seeds).map((c, i) => (c.length > 2 ? centroid(c) : seeds[i]));
  return voronoi(clip, seeds).filter((c) => c.length > 2 && Math.abs(area(c)) > 60);
}

// background of staggered rectangles (like a mosaic wall). returns [x,y,w,h] rectangles
export function mosaicRects(x, y, w, h, seed, min = 110, depth = 5) {
  const rnd = rng(seed), out = [];
  (function split(x0, y0, w0, h0, d) {
    const vert = w0 > h0 * 1.15 ? true : h0 > w0 * 1.15 ? false : rnd() < 0.5;
    const span = vert ? w0 : h0;
    if (d === 0 || span < min * 1.9) { out.push([x0, y0, w0, h0]); return; }
    const k = 0.36 + rnd() * 0.28;
    if (vert) { const s = w0 * k; split(x0, y0, s, h0, d - 1); split(x0 + s, y0, w0 - s, h0, d - 1); } else { const s = h0 * k; split(x0, y0, w0, s, d - 1); split(x0, y0 + s, w0, h0 - s, d - 1); }
  }(x, y, w, h, depth));
  return out;
}
export const rectD = (x, y, w, h) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
export { R, Ln, DEG };

// dense polygon along a smooth closed curve through the points (Catmull-Rom), for clipping facets to a curved outline
export function sampleClosed(pts, steps = 8) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t, f = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  return out;
}
export const mirror = (pts) => pts.map(([x, y]) => [800 - x, y]);
// stained-glass shading: each facet takes a tone (dark -> light) from where it sits relative to a light direction
export function shadeFacets(cells, tones, o = {}) {
  const rnd = rng(o.seed || 1), light = o.light || [-1, -1], c0 = o.center || [400, 400], spread = o.spread || 300, jit = o.jitter ?? 0.34, ow = o.ow ?? 2.4;
  const L = Math.hypot(light[0], light[1]) || 1, K = tones.length;
  const ts = cells.map((c) => { const [x, y] = centroid(c), v = ((x - c0[0]) * light[0] + (y - c0[1]) * light[1]) / (L * spread); return (Math.max(-1, Math.min(1, v)) + 1) / 2 + (rnd() - 0.5) * jit; });
  const idx = ts.map((t) => Math.max(0, Math.min(K - 1, Math.floor(t * K))));
  for (let k = 0; k < K; k++) {                                   // make sure every tone is used at least once
    if (idx.includes(k)) continue;
    let best = -1, bd = 1e9; ts.forEach((t, i) => { const d = Math.abs(t - (k + 0.5) / K); if (d < bd && idx.filter((v) => v === idx[i]).length > 1) { bd = d; best = i; } });
    if (best >= 0) idx[best] = k;
  }
  return cells.map((c, i) => R(tones[idx[i]], poly(c), { ow }));
}
