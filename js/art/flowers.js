import { R, Ln, rect, circle, ellipse, poly, smooth, curve, curveTo, cloud, petal, M, L, DEG, polar } from '../kit.js';

// a leaf / stem built from a quadratic centre line with a given thickness
function ribbon(c0, c1, c2, w0, w1 = w0, steps = 16) {
  const left = [], right = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, u = 1 - t;
    const x = u * u * c0[0] + 2 * u * t * c1[0] + t * t * c2[0], y = u * u * c0[1] + 2 * u * t * c1[1] + t * t * c2[1];
    const dx = 2 * u * (c1[0] - c0[0]) + 2 * t * (c2[0] - c1[0]), dy = 2 * u * (c1[1] - c0[1]) + 2 * t * (c2[1] - c1[1]);
    const len = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * t) / 2;
    left.push([x - (dy / len) * w, y + (dx / len) * w]); right.push([x + (dy / len) * w, y - (dx / len) * w]);
  }
  return poly([...left, ...right.reverse()]);
}
const toward = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);

// ---------------------------------------------------------------- Sunflower
function sunflower() {
  const it = [], cx = 400, cy = 300;
  it.push(R(1, rect(0, 0, 800, 800)));
  it.push(R(11, cloud(140, 110, 46)), R(11, cloud(670, 150, 38)));
  it.push(R(2, M(0, 800) + L([0, 650]) + curveTo([[0, 650], [200, 615], [420, 655], [620, 620], [800, 650]]) + L([800, 800]) + 'Z'));
  it.push(R(3, M(0, 800) + L([0, 730]) + curveTo([[0, 730], [180, 700], [380, 735], [600, 705], [800, 735]]) + L([800, 800]) + 'Z'));
  it.push(R(4, 'M386 440C390 540 378 660 384 800H418C412 660 424 540 414 440Z'));
  const l1 = [392, 650], l2 = [412, 590];
  it.push(R(5, petal(l1[0], l1[1], DEG(-152), 200, 52, 0.4)), R(5, petal(l2[0], l2[1], DEG(-28), 180, 48, 0.4)));
  it.push(Ln(`M${l1[0]} ${l1[1]}L${polar(...l1, 170, DEG(-152)).join(' ')}`, 1.8), Ln(`M${l2[0]} ${l2[1]}L${polar(...l2, 150, DEG(-28)).join(' ')}`, 1.8));
  const N = 14;
  for (let i = 0; i < N; i++) { const a = DEG(-90 + (360 / N) * i + 360 / N / 2 * 0); const b = polar(cx, cy, 70, a); it.push(R(6, petal(b[0], b[1], a, 160, 26, 0.3))); }
  for (let i = 0; i < N; i++) { const a = DEG(-90 + (360 / N) * i + 180 / N); const b = polar(cx, cy, 66, a); it.push(R(7, petal(b[0], b[1], a, 128, 24, 0.3))); }
  it.push(R(8, circle(cx, cy, 98)), R(9, circle(cx, cy, 72)), R(10, circle(cx, cy, 44)));
  const g = 137.508;
  for (let i = 1; i < 200; i++) { const r = 6.6 * Math.sqrt(i), a = DEG(g * i), p = polar(cx, cy, r, a); if (r < 90) it.push(Ln(circle(p[0], p[1], 2.8), 1.4)); }
  return {
    id: 'sunflower', cat: 'flowers', title: 'Sunflower', items: it,
    palette: [
      { n: 1, hex: '#cfeaf6', name: 'Sky' }, { n: 2, hex: '#8fc77a', name: 'Meadow' }, { n: 3, hex: '#b6dc95', name: 'Light grass' },
      { n: 4, hex: '#4d9a4f', name: 'Stem' }, { n: 5, hex: '#6cb45c', name: 'Leaf' }, { n: 6, hex: '#f2a31f', name: 'Amber petal' },
      { n: 7, hex: '#ffd23f', name: 'Sun yellow' }, { n: 8, hex: '#6b3f1d', name: 'Dark seed' }, { n: 9, hex: '#9a6430', name: 'Seed brown' },
      { n: 10, hex: '#c9923a', name: 'Golden seed' }, { n: 11, hex: '#ffffff', name: 'Cloud' },
    ],
  };
}

// ---------------------------------------------------------------- Tulip bouquet
function tulips() {
  const it = [];
  it.push(R(1, rect(0, 0, 800, 800)));
  it.push(R(4, rect(536, 66, 208, 268, 10)), R(2, rect(554, 84, 172, 232, 4)));
  it.push(Ln('M640 84V316', 3), Ln('M554 200H726', 3), R(1, circle(0, 0, 0.01)));
  it.pop();
  it.push(R(4, rect(0, 650, 800, 150)));
  it.push(Ln('M0 716C200 708 600 724 800 714', 1.6), Ln('M0 770C240 764 560 778 800 768', 1.6));
  // leaves behind the jar
  it.push(R(6, petal(388, 470, toward([388, 470], [190, 320]), 260, 40, 0.3)), R(6, petal(412, 470, toward([412, 470], [612, 330]), 250, 38, 0.3)));
  // jar
  it.push(R(3, 'M330 450H470V484Q470 488 480 490Q512 496 512 530V630Q512 672 470 672H330Q288 672 288 630V530Q288 496 320 490Q330 488 330 484Z'));
  it.push(R(2, 'M293 566Q322 552 352 566T412 566T472 566T507 560V630Q507 668 470 668H330Q293 668 293 630Z'));
  const tul = (cx, cy, ang, sc, nb, nf) => {
    const T = (pts) => pts.map(([x, y]) => [cx + (x * Math.cos(ang) - y * Math.sin(ang)) * sc, cy + (x * Math.sin(ang) + y * Math.cos(ang)) * sc]);
    const bl = [[0, -2], [-52, -22], [-70, -86], [-50, -154], [-22, -118], [0, -102]];
    const br = bl.map(([x, y]) => [-x, y]);
    const fr = [[0, 0], [-36, -50], [-40, -112], [0, -172], [40, -112], [36, -50]];
    return [R(nb, smooth(T(bl))), R(nb, smooth(T(br))), R(nf, smooth(T(fr)))];
  };
  // stems
  it.push(R(5, ribbon([400, 300], [400, 450], [402, 640], 16)), R(5, ribbon([292, 352], [310, 500], [372, 640], 14)), R(5, ribbon([510, 346], [492, 500], [434, 640], 14)));
  it.push(...tul(292, 356, DEG(-18), 0.88, 10, 11), ...tul(510, 350, DEG(16), 0.88, 12, 13), ...tul(400, 300, 0, 1, 8, 9));
  it.push(Ln('M304 500Q298 590 306 650', 2.2), Ln('M495 520Q500 600 494 656', 2.2));
  // ribbon and bow
  it.push(R(7, rect(292, 480, 220, 26, 6)));
  it.push(R(7, smooth([[400, 493], [360, 462], [326, 480], [330, 520], [364, 524]])), R(7, smooth([[400, 493], [440, 462], [474, 480], [470, 520], [436, 524]])));
  it.push(R(7, circle(400, 493, 13)));
  // fallen petals
  it.push(R(9, ellipse(240, 740, 32, 15, DEG(-20))), R(13, ellipse(600, 752, 30, 15, DEG(18))), R(11, ellipse(676, 700, 26, 13, DEG(-30))));
  return {
    id: 'tulips', cat: 'flowers', title: 'Tulip Bouquet', items: it,
    palette: [
      { n: 1, hex: '#fbeedd', name: 'Wall' }, { n: 2, hex: '#a9d6ee', name: 'Water blue' }, { n: 3, hex: '#dff3f2', name: 'Glass' },
      { n: 4, hex: '#b98456', name: 'Wood' }, { n: 5, hex: '#4d9a52', name: 'Stem green' }, { n: 6, hex: '#7cc16f', name: 'Leaf' },
      { n: 7, hex: '#ef7f6b', name: 'Coral ribbon' }, { n: 8, hex: '#c92f4a', name: 'Deep red' }, { n: 9, hex: '#ee5b73', name: 'Tulip red' },
      { n: 10, hex: '#f0a02a', name: 'Gold' }, { n: 11, hex: '#ffd95c', name: 'Yellow' }, { n: 12, hex: '#dd6d9a', name: 'Rose' }, { n: 13, hex: '#f6a8c6', name: 'Blush' },
    ],
  };
}

// ---------------------------------------------------------------- Lotus pond
function lotus() {
  const it = [];
  it.push(R(1, rect(0, 0, 800, 800)));
  it.push(R(2, M(-20, -20) + L([820, -20], [820, 250]) + curveTo([[820, 250], [650, 215], [500, 262], [340, 225], [150, 265], [-20, 235]]) + 'Z'));
  it.push(Ln(ellipse(400, 520, 330, 80), 1.5), Ln(ellipse(400, 520, 380, 100), 1.5));
  const pad = (cx, cy, rx, ry, notch) => {
    const a1 = notch + 0.22, a2 = notch - 0.22, p1 = [cx + rx * Math.cos(a1), cy + ry * Math.sin(a1)], p2 = [cx + rx * Math.cos(a2), cy + ry * Math.sin(a2)];
    const d = `M${cx} ${cy}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}A${rx} ${ry} 0 1 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z`;
    const veins = [];
    for (let k = 1; k <= 6; k++) { const a = notch + 0.22 + ((Math.PI * 2 - 0.44) * k) / 7; veins.push(Ln(`M${cx} ${cy}L${(cx + rx * 0.9 * Math.cos(a)).toFixed(1)} ${(cy + ry * 0.9 * Math.sin(a)).toFixed(1)}`, 1.4)); }
    return [R(3, d), ...veins];
  };
  it.push(...pad(130, 610, 130, 66, 0.35), ...pad(660, 650, 140, 70, 2.6), ...pad(110, 360, 78, 40, -0.4), ...pad(700, 340, 70, 36, 3.4), ...pad(420, 760, 120, 50, -2.8));
  it.push(R(7, ribbon([590, 620], [640, 520], [606, 392], 16)));
  const baseX = 400, baseY = 480;
  const fan = (deltas, len0, drop, wid, n) => deltas.slice().sort((a, b) => Math.abs(b) - Math.abs(a)).forEach((d) => it.push(R(n, petal(baseX, baseY, DEG(-90 + d), len0 - Math.abs(d) * drop, wid, 0.2))));
  fan([-78, -58.5, -39, -19.5, 0, 19.5, 39, 58.5, 78], 262, 0.5, 38, 4);
  fan([-68, -48.8, -29.3, -9.8, 9.8, 29.3, 48.8, 68], 224, 0.45, 34, 5);
  fan([-46, -23, 0, 23, 46], 176, 0.4, 32, 6);
  // bud
  [-24, 24, 0].forEach((d, i) => it.push(R(i === 2 ? 6 : 4, petal(606, 392, DEG(-90 + d), 96, 21, 0.2))));
  // dragonfly
  const dx = 568, dy = 150, rot = DEG(28);
  const wing = (ox, oy, a) => R(9, ellipse(dx + ox, dy + oy, 52, 15, a));
  it.push(wing(-34, -34, DEG(-18)), wing(34, -34, DEG(18)), wing(-36, -6, DEG(-8)), wing(36, -6, DEG(8)));
  it.push(R(8, ellipse(dx, dy + 22, 11, 62, 0)), R(8, circle(dx, dy - 52, 13)));
  it.push(Ln(`M${dx} ${dy - 12}V${dy + 78}`, 1.4));
  return {
    id: 'lotus', cat: 'flowers', title: 'Lotus Pond', items: it,
    palette: [
      { n: 1, hex: '#6fb8c4', name: 'Pond' }, { n: 2, hex: '#aadcd7', name: 'Shallow water' }, { n: 3, hex: '#62b06b', name: 'Lily pad' },
      { n: 4, hex: '#df4f89', name: 'Deep pink' }, { n: 5, hex: '#f08cb2', name: 'Pink' }, { n: 6, hex: '#fbc7d9', name: 'Blush' },
      { n: 7, hex: '#3f9a62', name: 'Stem' }, { n: 8, hex: '#3b6fb0', name: 'Dragonfly blue' }, { n: 9, hex: '#bfe4f6', name: 'Wing' },
    ],
  };
}

export const flowers = [sunflower(), tulips(), lotus()];
