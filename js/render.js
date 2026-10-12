export const W = 800;
export const INK = '#80847f';
export const PAPER = '#fffefb';
export const OUTLINE = 1.05;     // fine-line weight of a section's edge, in art units (the picture is 800 x 800)
export const DETAIL = 0.85;     // default weight of a detail line

export function pathOf(it) { return it.path || (it.path = new Path2D(it.d)); }

// Draws the ink outline. Lines that sit under a later (higher) section are hidden, so layered shapes read cleanly.
export function strokeItems(ctx, items, scale, minWidth = 1) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.fillStyle = '#000';
  const floor = minWidth / scale;
  for (const it of items) {
    const p = pathOf(it);
    if (it.line) { ctx.lineWidth = Math.max(Math.min(it.w || DETAIL, 1.1), floor); ctx.stroke(p); continue; }
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill(p, it.eo ? 'evenodd' : 'nonzero');
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = Math.max(Math.min(it.ow || OUTLINE, 1.4), floor);
    ctx.stroke(p);
  }
  ctx.restore();
}

// Fully coloured version of an illustration (used to check the artwork and for thumbnails of finished pictures).
export function drawSolution(ctx, art, scale) {
  const map = {}; art.palette.forEach((c) => { map[c.n] = c.hex; });
  ctx.save(); ctx.scale(scale, scale);
  for (const it of art.items) { if (it.line) continue; ctx.fillStyle = map[it.n] || '#ccc'; ctx.fill(pathOf(it), it.eo ? 'evenodd' : 'nonzero'); }
  ctx.restore();
}

export function paperCanvas(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.fillStyle = PAPER; g.fillRect(0, 0, size, size);
  return c;
}
