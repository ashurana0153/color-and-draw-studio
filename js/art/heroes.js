import { R, Ln, rect, circle, ellipse, poly, smooth, curve, curveTo, petal, star, wedge, M, L, DEG, polar } from '../kit.js';

const star4 = (x, y, s) => Ln(`M${x} ${y - s}L${x + s * 0.28} ${y - s * 0.28}L${x + s} ${y}L${x + s * 0.28} ${y + s * 0.28}L${x} ${y + s}L${x - s * 0.28} ${y + s * 0.28}L${x - s} ${y}L${x - s * 0.28} ${y - s * 0.28}Z`, 1.8);
const windows = (x, y, w, h) => {
  let d = '';
  for (let yy = y + 16; yy + 20 <= y + h - 6; yy += 30) for (let xx = x + 12; xx + 12 <= x + w - 8; xx += 24) d += `M${xx} ${yy}h11v15h-11Z`;
  return Ln(d, 1.3);
};
const rays = (cx, cy, n, num, rot = 0) => { const a = []; for (let i = 0; i < n; i += 2) a.push(R(num, wedge(cx, cy, DEG(rot + (360 / n) * i), DEG(rot + (360 / n) * (i + 1))))); return a; };

// ---------------------------------------------------------------- Captain Nova (portrait)
function nova() {
  const it = [];
  it.push(R(1, rect(0, 0, 800, 800)), ...rays(400, 420, 16, 2, 4));
  [[90, 90, 14], [700, 120, 12], [60, 360, 10], [740, 380, 11]].forEach(([x, y, s]) => it.push(star4(x, y, s)));
  it.push(R(3, 'M0 800V640C60 560 180 510 300 490H500C620 510 740 560 800 640V800Z'));
  it.push(R(4, 'M60 800C70 680 130 600 250 560L330 530H470L550 560C670 600 730 680 740 800Z'));
  it.push(R(5, poly([[350, 440], [450, 440], [460, 548], [400, 604], [340, 548]])));
  it.push(Ln('M335 534L400 606L465 534', 2.2));
  it.push(R(8, circle(400, 712, 78)), R(6, circle(400, 712, 63)), R(7, star(400, 712, 52, 22)));
  it.push(R(9, ellipse(400, 280, 128, 150)));
  it.push(R(5, circle(293, 322, 22)), R(5, circle(507, 322, 22)));
  it.push(R(5, smooth([[400, 170], [490, 208], [504, 300], [482, 390], [432, 440], [400, 448], [368, 440], [318, 390], [296, 300], [310, 208]])));
  it.push(R(3, smooth([[298, 268], [346, 242], [400, 256], [454, 242], [502, 268], [510, 304], [468, 334], [430, 320], [400, 314], [370, 320], [332, 334], [290, 304]])));
  it.push(R(6, smooth([[318, 292], [346, 276], [380, 292], [348, 308]])), R(6, smooth([[482, 292], [454, 276], [420, 292], [452, 308]])));
  it.push(Ln(circle(346, 292, 6), 2), Ln(circle(454, 292, 6), 2));
  it.push(R(9, smooth([[300, 224], [326, 156], [400, 126], [480, 152], [506, 214], [468, 188], [420, 172], [372, 188], [338, 220]])));
  it.push(Ln(curve([[392, 332], [388, 362], [400, 368], [412, 362]]), 2.2), Ln(curve([[364, 398], [400, 414], [436, 398]]), 2.4));
  return {
    id: 'nova', cat: 'heroes', title: 'Captain Nova', items: it,
    palette: [
      { n: 1, hex: '#2a3766', name: 'Night' }, { n: 2, hex: '#415bab', name: 'Rays' }, { n: 3, hex: '#d6405a', name: 'Hero red' },
      { n: 4, hex: '#2f7be0', name: 'Suit blue' }, { n: 5, hex: '#f4cba7', name: 'Skin' }, { n: 6, hex: '#ffffff', name: 'White' },
      { n: 7, hex: '#ffc83d', name: 'Star gold' }, { n: 8, hex: '#1f2a55', name: 'Navy' }, { n: 9, hex: '#5a3a2e', name: 'Hair' },
    ],
  };
}

// ---------------------------------------------------------------- Bolt Guardian (winged emblem)
function bolt() {
  const it = [];
  it.push(R(1, rect(0, 0, 800, 800)), ...rays(400, 400, 16, 2, 0));
  [[80, 80, 14], [720, 70, 12], [150, 230, 9], [660, 230, 10], [50, 420, 9], [760, 400, 9]].forEach(([x, y, s]) => it.push(star4(x, y, s)));
  const hs = [520, 470, 545, 450, 505, 470, 545, 500];
  hs.forEach((y, i) => { it.push(R(i % 2 ? 4 : 3, rect(i * 100, y, 100, 800 - y))); it.push(windows(i * 100, y, 100, 800 - y)); });
  const wing = (mirror) => {
    const a = (deg) => (mirror ? DEG(180 - deg) : DEG(deg)), bx = mirror ? 470 : 330, by = 372;
    [[-172, 190], [-155, 245], [-138, 278], [-121, 262], [-104, 214]].forEach(([d, l]) => it.push(R(5, petal(bx, by, a(d), l, 40, 0.3))));
    [[-166, 118], [-148, 132], [-130, 138], [-112, 120]].forEach(([d, l]) => it.push(R(6, petal(bx, by + 4, a(d), l, 30, 0.2))));
  };
  wing(false); wing(true);
  it.push(R(7, 'M298 258H502V382C502 462 454 528 400 570C346 528 298 462 298 382Z'));
  it.push(R(8, 'M311 271H489V382C489 454 446 512 400 550C354 512 311 454 311 382Z'));
  it.push(R(9, 'M325 285H475V382C475 446 440 498 400 531C360 498 325 446 325 382Z'));
  it.push(R(8, poly([[420, 298], [354, 410], [394, 410], [372, 512], [448, 388], [406, 388]])));
  it.push(R(8, star(400, 226, 28, 12)));
  return {
    id: 'bolt', cat: 'heroes', title: 'Bolt Guardian', items: it,
    palette: [
      { n: 1, hex: '#2d2a5a', name: 'Night' }, { n: 2, hex: '#413d82', name: 'Rays' }, { n: 3, hex: '#4f4b98', name: 'City dark' },
      { n: 4, hex: '#6a66b8', name: 'City light' }, { n: 5, hex: '#eef0ff', name: 'Silver feather' }, { n: 6, hex: '#bfc3f4', name: 'Lavender feather' },
      { n: 7, hex: '#20254d', name: 'Shield navy' }, { n: 8, hex: '#ffc83d', name: 'Gold' }, { n: 9, hex: '#e0405a', name: 'Hero red' },
    ],
  };
}

// ---------------------------------------------------------------- Rooftop Guardian (from behind)
function rooftop() {
  const it = [];
  it.push(R(1, rect(0, 0, 800, 800)));
  it.push(R(2, circle(570, 220, 125)));
  it.push(R(3, circle(535, 190, 26)), R(3, circle(610, 250, 20)), R(3, circle(585, 160, 13)));
  [[90, 90, 14], [220, 170, 10], [380, 80, 12], [120, 290, 9], [730, 60, 10], [300, 240, 8]].forEach(([x, y, s]) => it.push(star4(x, y, s)));
  const far = [470, 430, 490, 440, 480, 420, 500, 460, 470, 440];
  far.forEach((y, i) => { it.push(R(4, rect(i * 82 - 4, y, 82, 640 - y))); it.push(windows(i * 82 - 4, y, 82, 160)); });
  [[380, 530, 92], [472, 505, 92], [564, 545, 92], [656, 495, 92], [748, 530, 70]].forEach(([x, y, w]) => { it.push(R(5, rect(x, y, w, 640 - y))); it.push(windows(x, y, w, 100)); });
  it.push(R(6, rect(0, 630, 800, 170)), Ln('M0 700H800', 1.6), Ln('M200 700V800M400 700V800M600 700V800', 1.6));
  it.push(R(6, rect(588, 560, 120, 72, 6)), Ln('M606 580H690M606 600H690M606 620H690', 1.6));
  // cape
  it.push(R(8, smooth([[238, 318], [362, 316], [440, 298], [550, 326], [655, 396], [745, 500], [706, 522], [664, 504], [628, 566], [578, 526], [528, 574], [476, 528], [424, 566], [384, 478], [330, 442], [268, 442], [236, 336]], 0.9)));
  it.push(R(9, smooth([[372, 332], [480, 338], [584, 396], [650, 470], [580, 438], [470, 396], [390, 372]], 0.9)), R(9, smooth([[404, 424], [476, 458], [544, 520], [478, 506], [424, 474]], 0.9)));
  // body
  it.push(R(7, poly([[258, 430], [342, 430], [348, 520], [344, 614], [304, 614], [300, 500], [296, 614], [256, 614], [252, 520]])));
  it.push(R(8, rect(248, 596, 56, 36, 10)), R(8, rect(296, 596, 56, 36, 10)));
  it.push(R(7, smooth([[230, 332], [262, 312], [338, 312], [370, 332], [354, 384], [342, 440], [258, 440], [246, 384]], 0.9)));
  it.push(R(7, smooth([[222, 338], [250, 322], [258, 384], [254, 444], [232, 450], [220, 396]], 0.9)), R(7, smooth([[378, 338], [350, 322], [342, 384], [346, 444], [368, 450], [380, 396]], 0.9)));
  it.push(R(8, circle(238, 464, 17)), R(8, circle(362, 464, 17)));
  it.push(R(10, rect(256, 428, 88, 18, 4)));
  it.push(R(11, circle(300, 262, 46)));
  it.push(R(8, smooth([[254, 254], [300, 246], [346, 254], [346, 270], [300, 264], [254, 270]], 0.8)));
  it.push(R(8, poly([[342, 256], [394, 244], [374, 258], [400, 270], [342, 268]])));
  return {
    id: 'rooftop', cat: 'heroes', title: 'Rooftop Guardian', items: it,
    palette: [
      { n: 1, hex: '#26305e', name: 'Night' }, { n: 2, hex: '#fff0c4', name: 'Moon' }, { n: 3, hex: '#f1d98e', name: 'Crater' },
      { n: 4, hex: '#3a4580', name: 'Far city' }, { n: 5, hex: '#2c3566', name: 'Near city' }, { n: 6, hex: '#6d75ab', name: 'Rooftop' },
      { n: 7, hex: '#2f7be0', name: 'Suit blue' }, { n: 8, hex: '#d6405a', name: 'Hero red' }, { n: 9, hex: '#a62a44', name: 'Deep red' },
      { n: 10, hex: '#ffc83d', name: 'Gold' }, { n: 11, hex: '#5a3a2e', name: 'Hair' },
    ],
  };
}

export const heroes = [nova(), bolt(), rooftop()];
