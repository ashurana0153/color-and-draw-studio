import { R, Ln, rect, circle, ellipse, poly, smooth, curve, curveTo, cloud, pine, M, L } from '../kit.js';

// a wavy ribbon across the picture
function band(y, thick, amp, ph = 0, x0 = -40, x1 = 840) {
  const top = [], bot = [];
  for (let x = x0, i = 0; x <= x1; x += 110, i++) { const o = Math.sin(i * 1.3 + ph) * amp; top.push([x, y + o]); bot.push([x, y + thick + o * 0.8]); }
  bot.reverse();
  return M(...top[0]) + curveTo(top) + L(bot[0]) + curveTo(bot) + 'Z';
}
const addPine = (items, p, tierN, trunkN) => { p.tiers.forEach((d) => items.push(R(tierN, d))); items.push(R(trunkN, p.trunk)); };
const cap = (px, py, k = 1) => poly([[px, py], [px - 30 * k, py + 46 * k], [px - 15 * k, py + 36 * k], [px - 1 * k, py + 54 * k], [px + 13 * k, py + 36 * k], [px + 28 * k, py + 46 * k]]);
const bird = (x, y, s = 1) => Ln(curve([[x - 16 * s, y + 2 * s], [x - 8 * s, y - 8 * s], [x, y + 2 * s], [x + 8 * s, y - 8 * s], [x + 16 * s, y + 2 * s]]), 2.4);

// ---------------------------------------------------------------- Mountain Sunrise
function sunrise() {
  const it = [];
  it.push(R(1, rect(0, 0, 800, 800)));
  it.push(R(2, 'M0 330C160 300 300 360 420 330C540 300 680 340 800 310V800H0Z'));
  it.push(R(4, circle(400, 425, 150)));
  it.push(R(3, circle(400, 425, 92)));
  it.push(R(5, cloud(150, 190, 50)), R(5, cloud(630, 135, 60)), R(5, cloud(690, 285, 36)), R(5, cloud(250, 300, 34)));
  it.push(R(6, poly([[0, 800], [0, 480], [100, 410], [180, 470], [270, 360], [360, 490], [400, 522], [470, 480], [560, 400], [650, 470], [730, 380], [800, 440], [800, 800]])));
  it.push(R(7, cap(270, 360, 1)), R(7, cap(560, 400, 1)), R(7, cap(730, 380, 0.95)), R(7, cap(100, 410, 0.8)));
  it.push(R(8, poly([[0, 800], [0, 580], [130, 515], [240, 575], [340, 535], [470, 615], [580, 545], [690, 595], [800, 545], [800, 800]])));
  it.push(R(9, 'M0 645C160 628 320 654 480 638C620 625 720 642 800 632V800H0Z'));
  it.push(R(3, rect(338, 676, 124, 26, 13)), R(3, rect(356, 716, 88, 24, 12)), R(3, rect(374, 752, 52, 22, 11)));
  it.push(Ln(curve([[60, 676], [110, 668], [160, 676]]), 2.2), Ln(curve([[600, 690], [660, 682], [720, 690]]), 2.2), Ln(curve([[130, 726], [200, 718], [270, 726]]), 2.2), Ln(curve([[560, 748], [620, 740], [680, 748]]), 2.2));
  it.push(R(12, 'M0 705C90 692 170 722 235 800H0Z'), R(12, 'M800 695C720 698 650 726 598 800H800Z'));
  addPine(it, pine(68, 784, 230, 124), 10, 11); addPine(it, pine(170, 794, 160, 92), 10, 11);
  addPine(it, pine(735, 784, 240, 128), 10, 11); addPine(it, pine(640, 794, 150, 88), 10, 11);
  it.push(bird(520, 190), bird(560, 160, 0.8), bird(470, 240, 0.7));
  return {
    id: 'sunrise', cat: 'nature', title: 'Mountain Sunrise', items: it,
    palette: [
      { n: 1, hex: '#8fc9ee', name: 'Sky' }, { n: 2, hex: '#f9cfb0', name: 'Peach glow' }, { n: 3, hex: '#ffd45e', name: 'Sunshine' },
      { n: 4, hex: '#ffeaa8', name: 'Soft glow' }, { n: 5, hex: '#fff4ef', name: 'Cloud' }, { n: 6, hex: '#b7a7d8', name: 'Far lilac' },
      { n: 7, hex: '#f4f8ff', name: 'Snow' }, { n: 8, hex: '#6f90b9', name: 'Mountain blue' }, { n: 9, hex: '#3f9fa8', name: 'Lake teal' },
      { n: 10, hex: '#3f7d4e', name: 'Pine green' }, { n: 11, hex: '#7a5a3c', name: 'Bark' }, { n: 12, hex: '#b89260', name: 'Earth' },
    ],
  };
}

// ---------------------------------------------------------------- Lighthouse Coast
function lighthouse() {
  const it = [];
  const xl = (y) => 165 + (460 - y) * 0.0704, xr = (y) => 265 - (460 - y) * 0.0704;
  it.push(R(1, rect(0, 0, 800, 800)));
  it.push(R(2, 'M0 300C140 270 260 320 400 295C540 270 680 320 800 290V800H0Z'));
  it.push(R(4, circle(580, 478, 160)));
  it.push(R(3, circle(580, 478, 98)));
  it.push(R(4, poly([[228, 172], [800, 95], [800, 255]])), R(4, poly([[192, 172], [0, 100], [0, 250]])));
  it.push(R(5, cloud(120, 150, 52)), R(5, cloud(560, 120, 44)), R(5, cloud(380, 395, 66)));
  it.push(R(6, rect(0, 478, 800, 322)));
  it.push(R(3, rect(522, 505, 120, 24, 12)), R(3, rect(540, 544, 84, 22, 11)), R(3, rect(556, 580, 52, 20, 10)));
  it.push(R(7, band(620, 34, 10, 0)), R(7, band(690, 40, 12, 1.5)), R(7, band(752, 42, 12, 3)));
  it.push(R(8, M(0, 800) + L([0, 530]) + curveTo([[0, 530], [70, 480], [160, 462], [250, 478], [330, 530], [385, 610], [455, 690], [530, 745], [610, 800]]) + L([0, 800]) + 'Z'));
  it.push(R(12, smooth([[0, 530], [70, 480], [160, 462], [250, 478], [330, 530], [255, 512], [160, 498], [70, 512], [0, 556]])));
  it.push(R(10, smooth([[455, 700], [505, 712], [558, 744], [605, 780], [560, 800], [498, 790], [466, 760], [430, 725]])));
  // tower stripes
  const lv = [460, 398, 336, 274, 215];
  for (let i = 0; i < 4; i++) it.push(R(i % 2 ? 10 : 9, poly([[xl(lv[i]), lv[i]], [xr(lv[i]), lv[i]], [xr(lv[i + 1]), lv[i + 1]], [xl(lv[i + 1]), lv[i + 1]]])));
  it.push(R(11, rect(172, 197, 76, 16, 4)));
  it.push(R(3, rect(190, 148, 40, 50)));
  it.push(Ln('M210 148V198', 1.6), Ln('M190 172H230', 1.6));
  it.push(R(9, poly([[184, 150], [210, 112], [236, 150]])));
  it.push(R(11, circle(210, 106, 10)));
  it.push(R(11, 'M194 460V418Q194 398 210 398Q226 398 226 418V460Z'));
  it.push(R(3, rect(199, 336, 22, 30, 11)), R(3, rect(199, 276, 22, 30, 11)));
  it.push(R(8, smooth([[800, 800], [800, 690], [750, 655], [695, 672], [660, 730], [668, 800]])));
  it.push(R(10, smooth([[690, 800], [700, 770], [735, 760], [770, 775], [800, 800]])));
  it.push(bird(430, 215), bird(480, 180, 0.8), bird(330, 255, 0.7));
  return {
    id: 'lighthouse', cat: 'nature', title: 'Lighthouse Coast', items: it,
    palette: [
      { n: 1, hex: '#a3d0ee', name: 'Sky' }, { n: 2, hex: '#f8c9a6', name: 'Sunset peach' }, { n: 3, hex: '#ffd35c', name: 'Sunshine' },
      { n: 4, hex: '#ffedb8', name: 'Light beam' }, { n: 5, hex: '#fff1ec', name: 'Cloud' }, { n: 6, hex: '#4aa7b6', name: 'Sea' },
      { n: 7, hex: '#2f8196', name: 'Deep sea' }, { n: 8, hex: '#8d8698', name: 'Rock' }, { n: 9, hex: '#d9534f', name: 'Lighthouse red' },
      { n: 10, hex: '#fbfdff', name: 'White' }, { n: 11, hex: '#3a3d52', name: 'Slate' }, { n: 12, hex: '#6fa85d', name: 'Grass' },
    ],
  };
}

// ---------------------------------------------------------------- Forest Cabin
function cabin() {
  const it = [];
  it.push(R(1, rect(0, 0, 800, 800)));
  it.push(R(2, circle(610, 165, 72)));
  it.push(R(3, circle(585, 145, 15)), R(3, circle(632, 188, 12)), R(3, circle(600, 198, 9)));
  const star4 = (x, y, s) => Ln(`M${x} ${y - s}L${x + s * 0.28} ${y - s * 0.28}L${x + s} ${y}L${x + s * 0.28} ${y + s * 0.28}L${x} ${y + s}L${x - s * 0.28} ${y + s * 0.28}L${x - s} ${y}L${x - s * 0.28} ${y - s * 0.28}Z`, 1.8);
  [[90, 90, 14], [220, 140, 10], [330, 70, 12], [440, 150, 9], [140, 230, 9], [720, 80, 11], [500, 60, 8], [60, 330, 10]].forEach(([x, y, s]) => it.push(star4(x, y, s)));
  it.push(R(4, M(0, 800) + L([0, 440]) + curveTo([[0, 440], [150, 385], [300, 435], [450, 392], [600, 425], [800, 375]]) + L([800, 800]) + 'Z'));
  it.push(R(5, M(0, 800) + L([0, 530]) + curveTo([[0, 530], [200, 480], [420, 538], [620, 488], [800, 528]]) + L([800, 800]) + 'Z'));
  addPine(it, pine(100, 532, 130, 70), 7, 8); addPine(it, pine(190, 518, 105, 58), 7, 8);
  addPine(it, pine(640, 508, 115, 62), 7, 8); addPine(it, pine(722, 528, 135, 72), 7, 8);
  it.push(R(6, M(0, 800) + L([0, 650]) + curveTo([[0, 650], [260, 604], [520, 648], [800, 604]]) + L([800, 800]) + 'Z'));
  it.push(R(12, poly([[372, 624], [428, 624], [540, 800], [262, 800]])));
  it.push(R(11, rect(448, 388, 38, 70)));
  it.push(R(11, circle(470, 360, 17)), R(11, circle(484, 325, 21)), R(11, circle(506, 284, 25)));
  it.push(R(9, rect(290, 470, 220, 154)));
  [500, 530, 560, 590].forEach((y) => it.push(Ln(`M290 ${y}H510`, 1.6)));
  it.push(R(10, poly([[262, 480], [400, 368], [538, 480]])));
  it.push(R(8, 'M375 624V562Q375 536 400 536Q425 536 425 562V624Z'));
  it.push(Ln(circle(414, 584, 3), 2));
  for (const x0 of [312, 434]) {
    it.push(R(8, rect(x0 - 2, 506, 58, 52, 3)));
    [[0, 0], [26, 0], [0, 23], [26, 23]].forEach(([dx, dy]) => it.push(R(3, rect(x0 + 2 + dx, 510 + dy, 24, 21))));
  }
  it.push(R(11, ellipse(300, 706, 30, 17)), R(11, ellipse(520, 726, 34, 19)));
  addPine(it, pine(78, 770, 340, 190), 13, 8); addPine(it, pine(220, 792, 230, 130), 13, 8);
  addPine(it, pine(728, 772, 350, 192), 13, 8); addPine(it, pine(600, 794, 220, 126), 13, 8);
  [[330, 640, 4], [480, 660, 4], [250, 600, 3], [560, 600, 3]].forEach(([x, y, r]) => it.push(Ln(circle(x, y, r), 2)));
  return {
    id: 'cabin', cat: 'nature', title: 'Forest Cabin', items: it,
    palette: [
      { n: 1, hex: '#4b5c9b', name: 'Night sky' }, { n: 2, hex: '#fff1c1', name: 'Moon' }, { n: 3, hex: '#ffd466', name: 'Warm glow' },
      { n: 4, hex: '#35507a', name: 'Far hills' }, { n: 5, hex: '#4f8a6a', name: 'Hills' }, { n: 6, hex: '#86b672', name: 'Meadow' },
      { n: 7, hex: '#2f6b52', name: 'Distant pine' }, { n: 8, hex: '#6e4b32', name: 'Dark wood' }, { n: 9, hex: '#c08a56', name: 'Logs' },
      { n: 10, hex: '#a8483f', name: 'Roof' }, { n: 11, hex: '#a39fb0', name: 'Stone' }, { n: 12, hex: '#e6cb96', name: 'Sand path' },
      { n: 13, hex: '#3f8a55', name: 'Pine green' },
    ],
  };
}

export const nature = [sunrise(), lighthouse(), cabin()];
