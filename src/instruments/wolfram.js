import { ctx, buf, bctx } from '../core/canvas.js';
import { state, colors } from '../core/state.js';
import { defGrid } from '../core/utils.js';
import { mulberry32 } from '../core/rng.js';

/* 6 — Wolfram 1-D elementary cellular automaton, scrolling.
   Each step computes a new generation from the bottom row via an 8-bit rule
   (30 / 90 / 110 …) and scrolls the history up — the woven moiré of the
   reference. 1-bit by construction. */

function nextGen(row, rule, wrap){
  const gw = row.length;
  const out = new Uint8Array(gw);
  for(let x = 0; x < gw; x++){
    const l = wrap ? row[(x - 1 + gw) % gw] : (x > 0 ? row[x - 1] : 0);
    const c = row[x];
    const r = wrap ? row[(x + 1) % gw] : (x < gw - 1 ? row[x + 1] : 0);
    const idx = (l << 2) | (c << 1) | r;
    out[x] = (rule >> idx) & 1;
  }
  return out;
}

export const wolfram = {
  label: 'Wolfram',
  params: [
    { key: 'cell',    label: 'Cell',        min: 2, max: 10,  step: 1,    val: 4 },
    { key: 'rule',    label: 'Rule',        min: 0, max: 255, step: 1,    val: 30 },
    { key: 'rate',    label: 'Scroll rate', min: 1, max: 40,  step: 1,    val: 14 },
    { key: 'density', label: 'Seed',        min: 0, max: 1,   step: 0.02, val: 0.5 },
    { key: 'wrap',    label: 'Edges', type: 'seg', options: ['wrap', 'void'], val: 'wrap' },
  ],
  init(s){
    const { gw, gh } = defGrid(s.W, s.H, s.p.cell);
    const wrap = s.p.wrap === 'wrap';
    const r = mulberry32(s.seed ^ 0x1d5b);
    let cur = new Uint8Array(gw);
    for(let x = 0; x < gw; x++) cur[x] = r() < s.p.density ? 1 : 0;
    // pre-fill the screen by iterating gh generations so it starts full
    const grid = new Uint8Array(gw * gh);
    for(let y = 0; y < gh; y++){
      grid.set(cur, y * gw);
      cur = nextGen(cur, s.p.rule | 0, wrap);
    }
    s.inst = { gw, gh, grid, cur, acc: 0, img: bctx.createImageData(gw, gh) };
  },
  step(s){
    const I = s.inst; if(!I) return;
    I.cur = nextGen(I.cur, s.p.rule | 0, s.p.wrap === 'wrap');
    I.grid.copyWithin(0, I.gw, I.gw * I.gh); // scroll up one row
    I.grid.set(I.cur, (I.gh - 1) * I.gw);    // newest generation at the bottom
  },
  draw(s, t){
    const I = s.inst; if(!I) return;
    const c = colors(), img = I.img.data, g = I.grid;
    for(let k = 0; k < g.length; k++){
      let v = g[k] ? 255 : 0;
      if(state.invert) v = 255 - v;
      const o = k * 4; img[o] = img[o + 1] = img[o + 2] = v; img[o + 3] = 255;
    }
    buf.width = I.gw; buf.height = I.gh;
    bctx.putImageData(I.img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, s.W, s.H);
    ctx.drawImage(buf, 0, 0, s.W, s.H);
  },
};
