import { R, Ln, rect, circle, ellipse, poly, smooth, DEG } from '../kit.js';
import { petalR, leaf, ring, dots, pol, star4 } from './util.js';

// ---------------------------------------------------------------- Mandala Bloom
function mandala() {
  const it = [], cx = 400, cy = 400;
  it.push(R(10, rect(0, 0, 800, 800)));
  [[0, 0], [800, 0], [0, 800], [800, 800]].forEach(([x, y]) => { it.push(R(9, circle(x, y, 176)), R(3, circle(x, y, 118)), Ln(circle(x, y, 140), 0.9)); });
  it.push(ring(6, cx, cy, 332, 374), Ln(circle(cx, cy, 384), 1));
  const od = []; for (let k = 0; k < 24; k++) od.push(pol(cx, cy, 353, DEG(k * 15)));
  it.push(dots(od, 4.5));
  for (let k = 0; k < 24; k++) { const a = DEG(k * 15), b = pol(cx, cy, 268, a); it.push(...petalR(k % 2 ? 7 : 5, b[0], b[1], a, 68, 15, 0.2)); }
  it.push(ring(2, cx, cy, 236, 270));
  const md = []; for (let k = 0; k < 24; k++) md.push(pol(cx, cy, 253, DEG(k * 15 + 7.5)));
  it.push(dots(md, 3.5));
  for (let k = 0; k < 12; k++) {
    const a = DEG(k * 30), b = pol(cx, cy, 138, a), c = pol(cx, cy, 160, a);
    it.push(...petalR(3, b[0], b[1], a, 100, 35, 0.25, false));
    it.push(...petalR(8, c[0], c[1], a, 64, 17, 0.25, true));
  }
  for (let k = 0; k < 12; k++) { const p = pol(cx, cy, 127, DEG(k * 30 + 15)); it.push(R(1, circle(p[0], p[1], 10))); }
  for (let k = 0; k < 12; k++) { const a = DEG(k * 30 + 15), b = pol(cx, cy, 42, a); it.push(...petalR(k % 2 ? 9 : 4, b[0], b[1], a, 74, 18, 0.2)); }
  it.push(ring(5, cx, cy, 26, 46), R(1, circle(cx, cy, 26)), star4(cx, cy, 18));
  return {
    id: 'mandala', cat: 'arts', title: 'Mandala Bloom', items: it,
    palette: [
      { n: 1, hex: '#e8b54a', name: 'Marigold' }, { n: 2, hex: '#c8644a', name: 'Terracotta' }, { n: 3, hex: '#d98a85', name: 'Rose' }, { n: 4, hex: '#f0c7bd', name: 'Blush' },
      { n: 5, hex: '#2f7f7a', name: 'Teal' }, { n: 6, hex: '#1f4f5a', name: 'Deep teal' }, { n: 7, hex: '#9bb58a', name: 'Sage' }, { n: 8, hex: '#f8efe0', name: 'Cream' },
      { n: 9, hex: '#6a4c8c', name: 'Plum' }, { n: 10, hex: '#f1e6cc', name: 'Parchment' },
    ],
  };
}

// ---------------------------------------------------------------- Mural Peacock
function peacock() {
  const it = [], bx = 420, by = 565;
  it.push(R(1, rect(0, 0, 800, 800)));
  it.push(R(2, circle(400, 430, 336)), ring(3, 400, 430, 304, 336));
  const hd = []; for (let k = 0; k < 44; k++) hd.push(pol(400, 430, 320, DEG(k * (360 / 44))));
  it.push(dots(hd, 3.4));
  it.push(Ln(rect(20, 20, 760, 760, 18), 1.3), Ln(rect(32, 32, 736, 736, 12), 0.8));
  // the fan
  for (let k = 0; k < 9; k++) {
    const a = DEG(-170 + k * 20), b = pol(bx, by, 30, a), c = pol(bx, by, 72, a), e = pol(bx, by, 215, a);
    it.push(...petalR(k % 2 ? 4 : 5, b[0], b[1], a, 290, 46, 0.9, false));
    it.push(...petalR(6, c[0], c[1], a, 205, 29, 0.9, false));
    it.push(R(7, ellipse(e[0], e[1], 27, 21, a)), R(8, ellipse(e[0], e[1], 16, 12, a)), Ln(circle(e[0], e[1], 5.5), 1));
    const t = pol(bx, by, 262, a); it.push(Ln(`M${pol(bx, by, 236, a).join(' ')}L${t.join(' ')}`, 0.9));
  }
  // lotus at the base
  for (let k = 0; k < 7; k++) { const a = DEG(-155 + k * 21.7); it.push(...petalR(k % 2 ? 13 : 14, bx - 20, 790, a, 130, 27, 0.3, true)); }
  // the bird
  it.push(R(9, smooth([[314, 604], [344, 552], [412, 530], [484, 552], [524, 612], [504, 672], [420, 696], [344, 672]], 0.9)));
  it.push(R(9, smooth([[332, 590], [300, 508], [292, 432], [306, 396], [342, 400], [346, 446], [364, 508], [396, 566]], 0.8)));
  it.push(R(9, circle(322, 378, 34)));
  it.push(R(11, poly([[292, 370], [250, 388], [292, 394]])));
  it.push(Ln(circle(330, 372, 5), 1.2));
  it.push(Ln('M316 346q-8 -28 -26 -44M326 344q0 -32 -4 -58M336 346q10 -28 26 -42', 1.1), Ln(circle(288, 300, 8) + circle(321, 284, 8) + circle(364, 302, 8), 1));
  it.push(R(12, smooth([[396, 566], [470, 572], [514, 620], [476, 664], [400, 646]], 0.9)));
  it.push(Ln('M410 590q44 6 74 34M404 616q40 6 62 28', 1));
  it.push(R(10, smooth([[310, 470], [350, 480], [372, 540], [346, 600], [318, 560]], 0.8)));
  it.push(Ln('M360 696L350 746M452 690L468 746M336 748h30M452 748h30', 1.5));
  return {
    id: 'peacock', cat: 'arts', title: 'Mural Peacock', items: it,
    palette: [
      { n: 1, hex: '#e7a33f', name: 'Saffron' }, { n: 2, hex: '#f3c56d', name: 'Turmeric' }, { n: 3, hex: '#c9532f', name: 'Vermilion' },
      { n: 4, hex: '#2f7a5b', name: 'Peacock green' }, { n: 5, hex: '#25708f', name: 'Peacock blue' }, { n: 6, hex: '#9cc46e', name: 'Leaf light' },
      { n: 7, hex: '#f6d35a', name: 'Feather gold' }, { n: 8, hex: '#b8362b', name: 'Eye red' }, { n: 9, hex: '#1e5f86', name: 'Body blue' },
      { n: 10, hex: '#86c3c9', name: 'Breast teal' }, { n: 11, hex: '#e9a23a', name: 'Beak gold' }, { n: 12, hex: '#d4462f', name: 'Wing red' },
      { n: 13, hex: '#e8738f', name: 'Lotus pink' }, { n: 14, hex: '#f6bcc8', name: 'Lotus blush' },
    ],
  };
}

// ---------------------------------------------------------------- Moon Gazer
function moongazer() {
  const it = [];
  it.push(R(1, rect(0, 0, 800, 800)));
  it.push(R(2, circle(430, 330, 250)), ring(3, 430, 330, 214, 250), Ln(circle(430, 330, 262), 1));
  [[80, 90, 14], [700, 80, 12], [120, 360, 9], [730, 330, 10], [60, 600, 9], [760, 560, 8]].forEach(([x, y, s]) => it.push(star4(x, y, s)));
  // hair (behind), then the figure
  it.push(R(4, 'M384 184C318 186 266 238 258 330C250 430 238 520 196 626C176 684 168 742 182 800H396C372 716 388 614 404 536C418 478 384 444 366 408C356 346 364 260 384 184Z'));
  it.push(R(5, 'M386 190C436 186 470 222 472 272C473 294 480 306 492 330C498 344 490 348 478 348C486 358 486 364 474 368C482 376 480 386 474 396C470 412 456 426 436 432L428 474C472 504 562 522 622 562L706 800H180L214 626C262 540 336 504 346 470L360 340C362 276 368 224 386 190Z'));
  it.push(R(6, 'M350 440C378 464 410 464 436 436L428 474C404 494 372 494 346 472Z'));
  it.push(R(7, 'M346 470C336 504 262 540 214 626L180 800H706L622 562C562 522 472 504 428 474C410 520 372 520 346 470Z'));
  it.push(Ln('M268 800C300 690 322 600 376 540', 1.1), Ln('M246 520C270 560 284 600 282 660', 1.1), Ln('M300 330C296 400 310 450 330 480', 1.1), Ln('M284 262C320 230 360 214 392 214', 1));
  it.push(R(4, 'M384 184C434 180 468 214 472 262C456 236 424 222 392 228C380 250 376 286 376 322C360 280 366 220 384 184Z'));
  it.push(Ln(circle(404, 404, 8), 1.2), Ln('M346 520C390 548 450 556 520 540', 1));
  // flowers and leaves across the lap
  [[230, 700, -170, 170], [230, 700, -100, 150], [230, 700, -20, 150], [600, 706, -160, 150], [600, 706, -85, 150], [600, 706, -10, 150]].forEach(([x, y, a, l], i) => it.push(...leaf(x, y, DEG(a), l, 38, i % 2 ? 9 : 8, i % 2 ? 8 : 9, { veins: 3 })));
  const lotus = (x, y, s, n1, n2) => {
    for (let k = 0; k < 7; k++) { const a = DEG(-150 + k * 50), t = k % 2; it.push(...petalR(t ? n1 : n2, x, y, a, 120 * s, 34 * s, 0.35, true)); }
    for (let k = 0; k < 5; k++) { const a = DEG(-132 + k * 66); it.push(...petalR(k % 2 ? n2 : n1, x, y, a, 82 * s, 26 * s, 0.35, true)); }
    it.push(R(2, circle(x, y - 6 * s, 16 * s)));
  };
  lotus(230, 690, 1, 10, 11); lotus(600, 700, 0.82, 11, 10);
  return {
    id: 'moongazer', cat: 'arts', title: 'Moon Gazer', items: it,
    palette: [
      { n: 1, hex: '#1f4b57', name: 'Deep teal' }, { n: 2, hex: '#e8b04a', name: 'Moon gold' }, { n: 3, hex: '#f4d78e', name: 'Halo glow' },
      { n: 4, hex: '#1b1a22', name: 'Midnight hair' }, { n: 5, hex: '#b5683a', name: 'Warm skin' }, { n: 6, hex: '#96502c', name: 'Skin shadow' },
      { n: 7, hex: '#c9573a', name: 'Terracotta' }, { n: 8, hex: '#3d6a4a', name: 'Leaf dark' }, { n: 9, hex: '#7da35f', name: 'Leaf light' },
      { n: 10, hex: '#f8efe2', name: 'Petal white' }, { n: 11, hex: '#efbdb6', name: 'Petal pink' },
    ],
  };
}

export const arts = [mandala(), peacock(), moongazer()];
