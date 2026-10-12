// Tiny path toolkit for hand-building line art. Every helper returns an SVG path string in a 800 x 800 space.
const r1 = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${r1(p[0])} ${r1(p[1])}`;
const rad = (deg) => (deg * Math.PI) / 180;
export const DEG = rad;

export const rect = (x, y, w, h, r = 0) => (r
  ? `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`
  : `M${x} ${y}H${x + w}V${y + h}H${x}Z`);

export function ellipse(cx, cy, rx, ry, rot = 0) {
  const k = 0.5522847498, c = Math.cos(rot), s = Math.sin(rot);
  const T = (x, y) => pt([cx + x * c - y * s, cy + x * s + y * c]);
  return `M${T(rx, 0)}C${T(rx, ry * k)} ${T(rx * k, ry)} ${T(0, ry)}C${T(-rx * k, ry)} ${T(-rx, ry * k)} ${T(-rx, 0)}C${T(-rx, -ry * k)} ${T(-rx * k, -ry)} ${T(0, -ry)}C${T(rx * k, -ry)} ${T(rx, -ry * k)} ${T(rx, 0)}Z`;
}
export const circle = (cx, cy, r) => ellipse(cx, cy, r, r);

export const poly = (pts) => `M${pts.map(pt).join('L')}Z`;

// Catmull-Rom spline through the points. closed shape by default.
function bez(pts, closed, k) {
  const n = pts.length;
  let d = '';
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = closed ? pts[(i - 1 + n) % n] : pts[Math.max(i - 1, 0)];
    const p1 = pts[i], p2 = pts[(i + 1) % n];
    const p3 = closed ? pts[(i + 2) % n] : pts[Math.min(i + 2, n - 1)];
    const c1 = [p1[0] + ((p2[0] - p0[0]) * k) / 6, p1[1] + ((p2[1] - p0[1]) * k) / 6];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * k) / 6, p2[1] - ((p3[1] - p1[1]) * k) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}
export const smooth = (pts, k = 1) => `M${pt(pts[0])}${bez(pts, true, k)}Z`;
export const curve = (pts, k = 1) => `M${pt(pts[0])}${bez(pts, false, k)}`;
// continuation (no leading M) so curved edges can be mixed with straight ones: M a L b ...  + curveTo(...)
export const curveTo = (pts, k = 1) => bez(pts, false, k);
export const M = (x, y) => `M${r1(x)} ${r1(y)}`;
export const L = (...p) => p.map((q) => `L${pt(q)}`).join('');

// pointed petal / leaf: base at (cx,cy), points along angle `ang` (radians) for `len`, `wid` is the half-width.
export function petal(cx, cy, ang, len, wid, round = 0) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const T = (x, y) => pt([cx + x * c - y * s, cy + x * s + y * c]);
  const tip = len * (1 - round * 0.12);
  return `M${T(0, 0)}C${T(len * 0.12, -wid * 1.35)} ${T(len * (0.7 + round * 0.1), -wid * 1.25)} ${T(tip, 0)}C${T(len * (0.7 + round * 0.1), wid * 1.25)} ${T(len * 0.12, wid * 1.35)} ${T(0, 0)}Z`;
}
export function star(cx, cy, R, r, n = 5, rot = -Math.PI / 2) {
  const out = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n, rr = i % 2 ? r : R;
    out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return poly(out);
}
export function wedge(cx, cy, a1, a2, R = 1200) {
  return poly([[cx, cy], [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R], [cx + Math.cos(a2) * R, cy + Math.sin(a2) * R]]);
}
// fluffy cloud with a flat base, centred on x, base at y. s = scale (about half the width / 1.2)
export function cloud(x, y, s) {
  return `M${r1(x - 1.2 * s)} ${r1(y)}A${r1(0.45 * s)} ${r1(0.45 * s)} 0 0 1 ${r1(x - 0.55 * s)} ${r1(y - 0.55 * s)}A${r1(0.6 * s)} ${r1(0.6 * s)} 0 0 1 ${r1(x + 0.45 * s)} ${r1(y - 0.6 * s)}A${r1(0.5 * s)} ${r1(0.5 * s)} 0 0 1 ${r1(x + 1.2 * s)} ${r1(y)}Z`;
}
// layered pine: returns { tiers: [d...] (bottom first), trunk: d }
export function pine(cx, baseY, h, w) {
  const trunkH = h * 0.14, tiers = [];
  for (let k = 0; k < 3; k++) {
    const yb = baseY - trunkH - k * h * 0.25, yt = yb - h * 0.42, hw = (w / 2) * (1 - 0.24 * k);
    tiers.push(poly([[cx, yt], [cx + hw, yb], [cx - hw, yb]]));
  }
  return { tiers, trunk: rect(cx - w * 0.07, baseY - trunkH, w * 0.14, trunkH) };
}
export const rotate = (pts, cx, cy, a) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
export const move = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
export const flipX = (pts, ax) => pts.map(([x, y]) => [2 * ax - x, y]);
export const polar = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];

// items
export const R = (n, d, o = {}) => ({ n, d, ...o });          // a paintable, numbered section
export const Ln = (d, w = 1.6) => ({ line: true, d, w });      // a detail line (never painted)
