import { R, Ln, rect, circle, ellipse, poly, smooth, pine, DEG } from '../kit.js';
import { leaf, petalR, ring, dots, pol, star4, rng } from './util.js';

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// ---------------------------------------------------------------- Botanical Wreath
function wreath() {
  const it = [], cx = 400, cy = 400, RING = 252;
  it.push(R(1, rect(0, 0, 800, 800)));
  it.push(ring(2, cx, cy, 172, 352));
  it.push(R(3, circle(cx, cy, 172)));
  it.push(Ln(circle(cx, cy, 366), 1.1), Ln(circle(cx, cy, 160), 1), Ln(circle(cx, cy, 150), 0.8));
  // inner ornament: a quiet little star flower and a ring of dots
  const inner = []; for (let i = 0; i < 28; i++) inner.push(pol(cx, cy, 138, (i * Math.PI * 2) / 28));
  it.push(dots(inner, 2.2));
  for (let i = 0; i < 8; i++) { const a = DEG(i * 45 + 22.5); it.push(Ln(`M${pol(cx, cy, 18, a).join(' ')}L${pol(cx, cy, 108, a).join(' ')}`, 0.9)); }
  it.push(star4(cx, cy, 30));
  it.push(Ln(circle(cx, cy, RING), 1.8));
  // leaves along the ring: an outer leaf (two halves) and an inner leaf (one section) at every 45 degrees
  for (let i = 0; i < 10; i++) {
    const th = DEG(-90 + i * 36), b = pol(cx, cy, RING, th);
    it.push(...leaf(b[0], b[1], th + DEG(50), 142, 35, i % 2 ? 5 : 4, i % 2 ? 4 : 5, { veins: 3 }));
    it.push(...petalR(6, b[0], b[1], th + DEG(130), 112, 28, 0.1, true));
  }
  // berries in every other gap
  for (let j = 0; j < 5; j++) {
    const th = DEG(-90 + 54 + j * 72), b = pol(cx, cy, RING, th), c = Math.cos(th), s = Math.sin(th);
    const off = [[-20, -30], [24, -18], [-2, 26]].map(([ox, oy]) => [b[0] + ox * c - oy * s, b[1] + ox * s + oy * c]);
    for (const [x, y] of off) it.push(Ln(`M${b[0].toFixed(1)} ${b[1].toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}`, 1.2));
    for (const [x, y] of off) it.push(R(10, circle(x, y, 16)), Ln(`M${(x - 6).toFixed(1)} ${(y - 5).toFixed(1)}q3 -3 8 -2`, 1));
  }
  // flowers in the other gaps
  for (let j = 0; j < 5; j++) {
    const th = DEG(-90 + 18 + j * 72), c = pol(cx, cy, RING, th);
    for (let k = 0; k < 5; k++) it.push(...petalR(k % 2 ? 8 : 7, c[0], c[1], th + DEG(k * 72), 80, 29, 0.55));
    it.push(R(9, circle(c[0], c[1], 17)));
    const d = []; for (let k = 0; k < 6; k++) d.push(pol(c[0], c[1], 9.5, DEG(k * 60 + 15)));
    it.push(dots(d, 1.6));
  }
  return {
    id: 'wreath', cat: 'nature', title: 'Botanical Wreath', items: it,
    palette: [
      { n: 1, hex: '#efe8d8', name: 'Linen' }, { n: 2, hex: '#cfdacb', name: 'Sage mist' }, { n: 3, hex: '#f9f4e6', name: 'Cream' },
      { n: 4, hex: '#5f7f5a', name: 'Moss' }, { n: 5, hex: '#93b182', name: 'Fern' }, { n: 6, hex: '#3f5a46', name: 'Olive' },
      { n: 7, hex: '#ecbdb6', name: 'Blush' }, { n: 8, hex: '#cb6a7c', name: 'Rose' }, { n: 9, hex: '#e4a73f', name: 'Marigold' }, { n: 10, hex: '#7a3f5c', name: 'Plum' },
    ],
  };
}

// ---------------------------------------------------------------- Sunflower
function sunflowerHead(it, cx, cy, s, nPet, nums, discNums, seeds = true) {
  const R0 = 92 * s;
  for (let layer = 0; layer < 2; layer++) {
    for (let k = 0; k < nPet; k++) {
      const a = DEG((360 / nPet) * (k + layer * 0.5) - 90), b = pol(cx, cy, R0 * (layer ? 0.92 : 0.86), a);
      it.push(...petalR(nums[(k + layer) % 2], b[0], b[1], a, (layer ? 118 : 128) * s, 28 * s, 0.25));
    }
  }
  it.push(ring(discNums[0], cx, cy, 70 * s, 96 * s), ring(discNums[1], cx, cy, 44 * s, 70 * s), R(discNums[2], circle(cx, cy, 44 * s)));
  if (seeds) {
    const d = [], g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 1; i < 130; i++) { const r = Math.sqrt(i / 130) * 88 * s, a = i * g; d.push(pol(cx, cy, r, a)); }
    it.push(dots(d, 2.6 * s));
  }
}
function sunflower() {
  const it = [], rnd = rng(7);
  it.push(R(1, rect(0, 0, 800, 800)));
  it.push(R(2, circle(400, 330, 318)), ring(3, 400, 330, 268, 318));
  it.push(R(4, 'M0 700C140 660 260 690 400 706C540 722 680 670 800 690V800H0Z'));
  // the little ones behind
  const stem = (x0, y0, x1, y1, w, num) => R(num, smooth([[x0 - w, y0], [x0 + w, y0], [x1 + w * 0.8, y1], [x1 - w * 0.8, y1]], 0.6));
  it.push(stem(150, 640, 142, 800, 7, 10)); it.push(stem(655, 628, 664, 800, 7, 10));
  sunflowerHead(it, 150, 600, 0.42, 10, [5, 6], [7, 8, 9], false);
  sunflowerHead(it, 655, 586, 0.4, 10, [5, 6], [7, 8, 9], false);
  // main stem and leaves
  it.push(R(10, smooth([[386, 430], [414, 430], [412, 620], [408, 800], [384, 800], [388, 620]], 0.5)));
  it.push(Ln('M399 445C397 560 399 680 396 790', 0.9));
  it.push(...leaf(396, 600, DEG(196), 210, 56, 10, 11, { veins: 4 }));
  it.push(...leaf(404, 690, DEG(-22), 196, 52, 11, 10, { veins: 4 }));
  sunflowerHead(it, 400, 330, 1.0, 14, [5, 6], [7, 8, 9], true);
  // grass
  let g = ''; for (let i = 0; i < 26; i++) { const x = 20 + i * 30 + rnd() * 14, h = 24 + rnd() * 26, l = (rnd() - 0.5) * 20; g += `M${x.toFixed(1)} 800q${(l / 2).toFixed(1)} ${(-h / 2).toFixed(1)} ${l.toFixed(1)} ${(-h).toFixed(1)}`; }
  it.push(Ln(g, 1));
  return {
    id: 'sunflower', cat: 'nature', title: 'Sunflower', items: it,
    palette: [
      { n: 1, hex: '#e4ece5', name: 'Morning mist' }, { n: 2, hex: '#f6e7b0', name: 'Butter' }, { n: 3, hex: '#efd48a', name: 'Soft gold' },
      { n: 4, hex: '#9bb58a', name: 'Meadow' }, { n: 5, hex: '#f0b429', name: 'Sunshine' }, { n: 6, hex: '#dd8a1f', name: 'Amber' },
      { n: 7, hex: '#8a5a2b', name: 'Umber' }, { n: 8, hex: '#5c3a1e', name: 'Brown' }, { n: 9, hex: '#3b2414', name: 'Seed dark' },
      { n: 10, hex: '#5a8450', name: 'Leaf' }, { n: 11, hex: '#8cab6f', name: 'Leaf light' },
    ],
  };
}

// ---------------------------------------------------------------- Mountain Lake
function snowCap(p, l, r, dy) {
  const edge = (q) => lerp(p, q, dy / (q[1] - p[1])), a = edge(l), b = edge(r);
  const z = (t, k) => { const q = lerp(b, a, t); return [q[0], q[1] + dy * k]; };
  return poly([p, b, z(0.22, 0.34), z(0.42, -0.04), z(0.62, 0.38), z(0.82, -0.02), a]);
}
function lake() {
  const it = [];
  it.push(R(1, rect(0, 0, 800, 210)), R(2, rect(0, 210, 800, 130)), R(3, rect(0, 340, 800, 200)));
  it.push(R(5, circle(520, 372, 100)), R(4, circle(520, 372, 70)));
  it.push(Ln(circle(520, 372, 112), 0.8));
  // clouds
  const cloud = (x, y, s) => `M${x - 1.2 * s} ${y}A${0.4 * s} ${0.4 * s} 0 0 1 ${x - 0.6 * s} ${y - 0.45 * s}A${0.55 * s} ${0.55 * s} 0 0 1 ${x + 0.4 * s} ${y - 0.5 * s}A${0.45 * s} ${0.45 * s} 0 0 1 ${x + 1.2 * s} ${y}Z`;
  it.push(R(6, cloud(150, 150, 60)), R(6, cloud(660, 110, 48)), R(6, cloud(320, 290, 44)));
  it.push(Ln('M96 130q22 -4 40 2M170 128q14 -10 34 -4', 0.9), Ln('M626 94q18 -4 34 2', 0.9));
  // far mountains
  const far = [[-10, 440], [70, 340], [130, 378], [235, 262], [335, 392], [400, 340], [480, 410], [595, 292], [700, 392], [760, 346], [810, 392], [810, 540], [-10, 540]];
  it.push(R(7, poly(far)));
  it.push(R(8, snowCap(far[3], far[2], far[4], 52)), R(8, snowCap(far[7], far[6], far[8], 58)), R(8, snowCap(far[1], [-10, 440], far[2], 36)));
  it.push(Ln('M235 262L250 340M595 292L560 380M595 292L620 372', 0.9));
  // mid mountains
  const mid = [[-10, 540], [105, 430], [190, 480], [305, 356], [425, 510], [525, 440], [640, 530], [725, 456], [810, 505], [810, 560], [-10, 560]];
  it.push(R(9, poly(mid)));
  it.push(R(8, snowCap(mid[3], mid[2], mid[4], 60)), R(8, snowCap(mid[7], mid[6], mid[8], 44)));
  it.push(Ln('M305 356L318 440M305 356L276 420M105 430L128 488M525 440L540 500', 0.9));
  // lake
  it.push(R(10, rect(0, 520, 800, 280)));
  it.push(R(4, ellipse(520, 626, 80, 9)), R(4, ellipse(520, 656, 58, 8)), R(4, ellipse(520, 683, 38, 7)));
  const band = (y0, y1, amp, ph) => { let d = `M0 ${y0}`; for (let x = 0; x <= 800; x += 20) d += `L${x} ${(y0 + Math.sin(x / 38 + ph) * amp).toFixed(1)}`; for (let x = 800; x >= 0; x -= 20) d += `L${x} ${(y1 + Math.sin(x / 38 + ph) * amp).toFixed(1)}`; return `${d}Z`; };
  it.push(R(11, band(704, 722, 3, 0)), R(11, band(742, 760, 3, 1.4)), R(11, band(780, 802, 3, 2.4)));
  // forest shore and pines
  it.push(R(12, 'M-10 556C120 528 230 560 330 574C450 590 540 556 650 538C720 528 770 544 810 552V604H-10Z'));
  const pines = [[44, 580, 170, 84], [120, 590, 128, 64], [196, 588, 100, 52], [612, 574, 112, 56], [688, 580, 176, 82], [764, 586, 134, 66]];
  pines.forEach(([x, y, h, w], i) => { const p = pine(x, y, h, w); p.tiers.forEach((t) => it.push(R(i % 2 ? 13 : 14, t))); it.push(Ln(`M${x} ${y}V${y - h * 0.14}`, 1.2)); });
  // foreground banks and reeds
  it.push(R(12, 'M-10 800V682C60 690 150 712 214 800Z'), R(12, 'M810 800V704C730 700 650 740 604 800Z'));
  it.push(Ln('M40 800C46 760 40 730 30 704M70 800C72 770 82 744 96 722M740 800C736 764 746 736 762 716M700 800C706 770 698 744 690 726', 1.2));
  it.push(Ln('M300 190q10 -10 20 0q10 -10 20 0M610 230q8 -8 16 0q8 -8 16 0', 1.2));
  return {
    id: 'lake', cat: 'nature', title: 'Mountain Lake', items: it,
    palette: [
      { n: 1, hex: '#d9d3e6', name: 'Lilac sky' }, { n: 2, hex: '#efd7d3', name: 'Blush sky' }, { n: 3, hex: '#f6e9cb', name: 'Cream sky' },
      { n: 4, hex: '#f0c36a', name: 'Sun gold' }, { n: 5, hex: '#f7e1a6', name: 'Sun glow' }, { n: 6, hex: '#fbf7ef', name: 'Cloud' },
      { n: 7, hex: '#a3b4cb', name: 'Far blue' }, { n: 8, hex: '#f4f6f8', name: 'Snow' }, { n: 9, hex: '#6f8aa3', name: 'Slate' },
      { n: 10, hex: '#a8c5cd', name: 'Lake' }, { n: 11, hex: '#7fa6b3', name: 'Deep water' }, { n: 12, hex: '#34493f', name: 'Shore dark' },
      { n: 13, hex: '#2f5a47', name: 'Pine' }, { n: 14, hex: '#4f7d63', name: 'Pine light' },
    ],
  };
}

export const nature = [wreath(), sunflower(), lake()];
