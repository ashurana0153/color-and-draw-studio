import { R, Ln, poly, circle, smooth, DEG } from '../kit.js';
import { facets, mosaicRects, rectD, sampleClosed, mirror, shadeFacets, rng, pol, dots } from './util.js';

const OW = 2.4;                                   // leading between the glass pieces
const half = (pts) => [...pts, ...mirror(pts.filter((p) => p[0] !== 400)).reverse()];   // right side + its mirror, no doubled points on the axis

// a mosaic wall behind the figure
function wall(it, seed, tones, o = {}) {
  const rnd = rng(seed + 11), rects = mosaicRects(0, 0, 800, 800, seed, o.min || 120, o.depth || 5);
  rects.forEach(([x, y, w, h]) => {
    const v = ((x + w / 2) / 800 + (y + h / 2) / 800) / 2 + (rnd() - 0.5) * 0.5;
    it.push(R(tones[Math.max(0, Math.min(tones.length - 1, Math.floor(v * tones.length)))], rectD(x, y, w, h), { ow: OW }));
  });
}

// ---------------------------------------------------------------- Solstice (sun helmet)
const scaleAbout = (pts, cx, cy, k) => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);

function solstice() {
  const it = [];
  wall(it, 21, [1, 2, 3, 4], { min: 150, depth: 5 });
  // sun halo behind the head
  it.push(R(20, circle(400, 300, 268), { ow: OW }), R(19, circle(400, 300, 268) + circle(400, 300, 232), { eo: true, ow: OW }));
  for (let i = 0; i < 16; i++) {
    const a = DEG(i * 22.5 - 90), l = pol(400, 300, 268, a - DEG(9)), r = pol(400, 300, 268, a + DEG(9)), tip = pol(400, 300, 338, a);
    it.push(R(i % 2 ? 19 : 21, poly([l, tip, r]), { ow: OW }));
  }
  // shoulders and chest
  const torso = [[330, 540], [470, 540], [486, 596], [576, 626], [700, 690], [750, 800], [50, 800], [100, 690], [224, 626], [314, 596]];
  shadeFacets(facets(torso, 12, 5, 2), [5, 6, 7, 8], { seed: 3, light: [-1, -0.6], center: [400, 680], spread: 340 }).forEach((r) => it.push(r));
  it.push(R(9, circle(400, 704, 54), { ow: OW }), R(10, circle(400, 704, 37), { ow: OW }));
  for (let i = 0; i < 8; i++) { const a = DEG(i * 45 + 22.5); it.push(Ln(`M${pol(400, 704, 41, a).join(' ')}L${pol(400, 704, 54, a).join(' ')}`, 1.4)); }
  // helmet
  const rt = [[400, 86], [480, 100], [545, 150], [582, 230], [588, 310], [574, 396], [540, 470], [490, 530], [444, 570], [400, 584]];
  const outline = sampleClosed(half(rt), 7);
  shadeFacets(facets(outline, 24, 9, 3), [11, 12, 13, 14], { seed: 8, light: [-1, -0.9], center: [400, 330], spread: 240 }).forEach((r) => it.push(r));
  // sun on the forehead: eight rays and a disc
  const cx = 400, cy = 190;
  for (let i = 0; i < 8; i++) {
    const a = DEG(i * 45 - 90), l = pol(cx, cy, 34, a - DEG(15)), r = pol(cx, cy, 34, a + DEG(15)), tip = pol(cx, cy, 72, a);
    it.push(R(i % 2 ? 15 : 16, poly([l, tip, r]), { ow: OW }));
  }
  it.push(R(16, circle(cx, cy, 36), { ow: OW }), R(15, circle(cx, cy, 19), { ow: OW }));
  // visor
  const vis = scaleAbout([[266, 318], [316, 292], [372, 300], [400, 322], [428, 300], [484, 292], [534, 318], [530, 366], [478, 384], [424, 366], [400, 380], [376, 366], [322, 384], [270, 366]], 400, 340, 1.16);
  it.push(R(17, smooth(vis, 0.2), { ow: 3 }));
  const glow = scaleAbout([[290, 328], [330, 312], [372, 322], [388, 338], [372, 352], [326, 360], [292, 350]], 400, 340, 1.16);
  it.push(R(18, smooth(glow, 0.3), { ow: OW }), R(18, smooth(mirror(glow), 0.3), { ow: OW }));
  it.push(Ln('M400 402V478M366 488q34 16 68 0', 1.3), Ln('M330 430q10 44 42 70M470 430q-10 44 -42 70', 1.1));
  return {
    id: 'solstice', cat: 'heroes', title: 'Solstice', items: it,
    palette: [
      { n: 1, hex: '#262a52', name: 'Midnight' }, { n: 2, hex: '#363b78', name: 'Indigo' }, { n: 3, hex: '#4d529b', name: 'Violet' }, { n: 4, hex: '#7a79b8', name: 'Wisteria' },
      { n: 5, hex: '#1d4a52', name: 'Deep teal' }, { n: 6, hex: '#2c6a70', name: 'Teal' }, { n: 7, hex: '#3f8a8a', name: 'Sea glass' }, { n: 8, hex: '#76b4aa', name: 'Mist teal' },
      { n: 9, hex: '#3a2412', name: 'Bronze dark' }, { n: 10, hex: '#f0b43c', name: 'Sun gold' },
      { n: 11, hex: '#7c4a22', name: 'Bronze deep' }, { n: 12, hex: '#a86a2e', name: 'Bronze' }, { n: 13, hex: '#d3913f', name: 'Copper gold' }, { n: 14, hex: '#f1c46a', name: 'Honey' },
      { n: 15, hex: '#fff1c4', name: 'Ray cream' }, { n: 16, hex: '#f7c94e', name: 'Ray gold' }, { n: 17, hex: '#16161d', name: 'Visor black' }, { n: 18, hex: '#ffd978', name: 'Visor glow' },
      { n: 19, hex: '#e9a93a', name: 'Halo amber' }, { n: 20, hex: '#f7e0a2', name: 'Halo pale' }, { n: 21, hex: '#f2c35c', name: 'Halo gold' },
    ],
  };
}

// ---------------------------------------------------------------- Tempest (hooded storm hero)
function tempest() {
  const it = [];
  wall(it, 5, [1, 2, 3, 4], { min: 140, depth: 5 });
  const rt = [[400, 60], [470, 86], [528, 146], [560, 230], [572, 320], [590, 410], [634, 470], [704, 520], [760, 590], [778, 690], [782, 800]];
  const outline = sampleClosed(half(rt), 6);
  shadeFacets(facets(outline, 34, 14, 3), [5, 6, 7, 8], { seed: 6, light: [-1, -0.8], center: [400, 400], spread: 380 }).forEach((r) => it.push(r));
  // lining of the hood
  const face = [[400, 214], [466, 234], [502, 300], [510, 372], [484, 446], [440, 494], [400, 508]];
  const faceClosed = half(face);
  const inner = sampleClosed(faceClosed, 8), outer = scaleAbout(inner, 400, 360, 1.16);
  it.push(R(13, smooth(outer, 1) + smooth(inner, 1), { eo: true, ow: OW }));
  shadeFacets(facets(inner, 9, 3, 3), [9, 10, 11, 12], { seed: 4, light: [-1, -1], center: [400, 360], spread: 170 }).forEach((r) => it.push(r));
  // lenses
  const lens = [[312, 316], [360, 310], [398, 334], [382, 362], [336, 366]];
  [lens, mirror(lens)].forEach((l) => {
    const cxl = l.reduce((a, p) => a + p[0], 0) / l.length, cyl = l.reduce((a, p) => a + p[1], 0) / l.length;
    it.push(R(15, smooth(scaleAbout(l, cxl, cyl, 1.32), 0.4), { ow: OW }), R(14, smooth(l, 0.4), { ow: OW }));
  });
  it.push(Ln('M400 380V440M376 466q24 12 48 0', 1.3));
  // lightning badge
  it.push(R(17, circle(400, 694, 70), { ow: OW }));
  it.push(R(16, poly([[428, 628], [366, 706], [398, 706], [378, 766], [440, 678], [408, 678]]), { ow: OW }));
  return {
    id: 'tempest', cat: 'heroes', title: 'Tempest', items: it,
    palette: [
      { n: 1, hex: '#c95a45', name: 'Coral deep' }, { n: 2, hex: '#e07a5a', name: 'Coral' }, { n: 3, hex: '#eea074', name: 'Apricot' }, { n: 4, hex: '#f6c9a4', name: 'Peach' },
      { n: 5, hex: '#1f2147', name: 'Indigo night' }, { n: 6, hex: '#2f3470', name: 'Indigo' }, { n: 7, hex: '#4a52a0', name: 'Periwinkle' }, { n: 8, hex: '#7a82c4', name: 'Lavender' },
      { n: 9, hex: '#8a90a6', name: 'Steel' }, { n: 10, hex: '#b5bbcc', name: 'Silver' }, { n: 11, hex: '#d9dde8', name: 'Pearl' }, { n: 12, hex: '#f2f4fa', name: 'Frost' },
      { n: 13, hex: '#cbc8f0', name: 'Hood lining' }, { n: 14, hex: '#fff3b8', name: 'Lens glow' }, { n: 15, hex: '#14152b', name: 'Lens rim' }, { n: 16, hex: '#f2bf3a', name: 'Bolt gold' }, { n: 17, hex: '#272a5c', name: 'Badge navy' },
    ],
  };
}

// ---------------------------------------------------------------- Skyline Sentinel (a caped hero on a rooftop, seen from behind)
function sentinel() {
  const it = [];
  wall(it, 33, [1, 2, 3, 4], { min: 170, depth: 4 });
  // moon
  it.push(R(5, circle(580, 214, 146), { ow: OW }), R(6, circle(580, 214, 146) + circle(580, 214, 114), { eo: true, ow: OW }));
  it.push(R(7, circle(540, 176, 26), { ow: OW }), R(7, circle(620, 240, 34), { ow: OW }), R(7, circle(548, 268, 16), { ow: OW }));
  // city: far layer, near layer, with lit windows drawn as lines
  const towers = (list, nums, top) => list.forEach(([x, w, y], i) => {
    it.push(R(nums[i % 2], rectD(x, y, w, 760 - y), { ow: OW }));
    let d = ''; for (let yy = y + 20; yy + 18 < 740; yy += 30) for (let xx = x + 14; xx + 12 < x + w - 8; xx += 26) d += `M${xx} ${yy}h12v16h-12Z`;
    it.push(Ln(d, 0.9));
  });
  towers([[0, 112, 548], [112, 92, 486], [204, 124, 566], [328, 96, 504], [424, 112, 536], [536, 100, 474], [636, 92, 548], [728, 90, 506]], [8, 9]);
  towers([[0, 140, 640], [560, 120, 624], [680, 120, 580]], [10, 11]);
  // rooftop
  it.push(R(12, rectD(0, 690, 800, 110), { ow: OW }));
  it.push(Ln('M0 744H800M70 690v54M190 744v56M310 690v54M430 744v56M550 690v54M670 744v56M770 690v54', 1));
  // the hero (drawn small, then placed and scaled)
  const T = ([x, y]) => [330 + (x - 350) * 1.06, 300 + (y - 404) * 1.12], TT = (pts) => pts.map(T);
  const P = (pts, o) => poly(TT(pts), o);
  it.push(R(14, P([[306, 724], [352, 724], [356, 752], [300, 752]]), { ow: OW }), R(14, P([[358, 724], [404, 724], [410, 752], [354, 752]]), { ow: OW }));
  it.push(R(13, P([[314, 600], [352, 600], [350, 726], [310, 726]]), { ow: OW }), R(13, P([[358, 600], [396, 600], [400, 726], [356, 726]]), { ow: OW }));
  const cape = [[292, 432], [322, 400], [378, 400], [412, 430], [470, 444], [546, 466], [620, 506], [690, 564], [742, 630], [780, 704], [724, 690], [690, 740], [630, 712], [596, 760], [540, 722], [498, 770], [450, 724], [410, 752], [380, 722], [330, 746], [300, 722], [286, 620]].map(([x, y]) => [x, y > 432 ? 432 + (y - 432) * 0.72 : y]);
  shadeFacets(facets(TT(cape), 15, 12, 3), [15, 16, 17, 18], { seed: 9, light: [1, -1], center: [520, 520], spread: 300 }).forEach((r) => it.push(r));
  it.push(R(13, smooth(TT([[322, 404], [350, 392], [378, 404], [380, 440], [320, 440]]), 0.6), { ow: OW }));
  it.push(R(13, smooth(TT([[312, 372], [320, 340], [350, 326], [380, 340], [388, 372], [376, 400], [350, 410], [324, 400]]), 0.8), { ow: OW }));
  it.push(R(14, P([[318, 350], [306, 304], [340, 334]]), { ow: OW }), R(14, P([[382, 350], [394, 304], [360, 334]]), { ow: OW }));
  it.push(Ln(`M${T([350, 330]).join(' ')}V${T([350, 404])[1].toFixed(1)}`, 1), Ln(`M${T([316, 520]).join(' ')}H${T([392, 520])[0].toFixed(1)}`, 1.1));
  return {
    id: 'sentinel', cat: 'heroes', title: 'Skyline Sentinel', items: it,
    palette: [
      { n: 1, hex: '#1d2047', name: 'Deep night' }, { n: 2, hex: '#2b2f66', name: 'Night' }, { n: 3, hex: '#3f4388', name: 'Dusk' }, { n: 4, hex: '#5d5ca2', name: 'Horizon' },
      { n: 5, hex: '#f6ecd0', name: 'Moon' }, { n: 6, hex: '#e7d6a6', name: 'Moon halo' }, { n: 7, hex: '#d4c08a', name: 'Moon shadow' },
      { n: 8, hex: '#4b4d92', name: 'Far city' }, { n: 9, hex: '#393b78', name: 'Far city deep' }, { n: 10, hex: '#262959', name: 'Near city' }, { n: 11, hex: '#1b1d44', name: 'Near city deep' },
      { n: 12, hex: '#101128', name: 'Rooftop' }, { n: 13, hex: '#323445', name: 'Suit' }, { n: 14, hex: '#171824', name: 'Boots and cowl' },
      { n: 15, hex: '#7a1c3a', name: 'Cape crimson' }, { n: 16, hex: '#a8294c', name: 'Cape red' }, { n: 17, hex: '#d44c66', name: 'Cape rose' }, { n: 18, hex: '#f28f94', name: 'Cape blush' },
    ],
  };
}

export const heroes = [solstice(), tempest(), sentinel()];
