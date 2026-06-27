import { ctx } from '../core/canvas.js';
import { state, colors } from '../core/state.js';
import { defGrid } from '../core/utils.js';
import { mulberry32 } from '../core/rng.js';

/* 7 — bits: binary / character rain. Columns of glyphs fall with a bright head
   and a fading trail. A pure function of time + a seeded per-column profile, so
   it re-renders deterministically (and exports cleanly). Strictly monochrome. */

const SETS = { binary: '01', hex: '0123456789ABCDEF', ascii: '01<>[]{}/\\=+*#' };

function hash(a, b){ let h = (Math.imul(a, 73856093) ^ Math.imul(b, 19349663)); h = (h ^ (h >>> 13)) >>> 0; return h; }

export const bits = {
  label: 'Bits',
  params: [
    { key: 'cell',    label: 'Glyph',   min: 8,   max: 28, step: 1,    val: 14 },
    { key: 'speed',   label: 'Fall',    min: 0.2, max: 4,  step: 0.05, val: 1.4 },
    { key: 'density', label: 'Density', min: 0.1, max: 1,  step: 0.02, val: 0.7 },
    { key: 'trail',   label: 'Trail',   min: 3,   max: 30, step: 1,    val: 14 },
    { key: 'set',     label: 'Set', type: 'seg', options: ['binary', 'hex', 'ascii'], val: 'binary' },
  ],
  init(s){
    const { gw, gh } = defGrid(s.W, s.H, s.p.cell);
    const r = mulberry32(s.seed ^ 0xb175);
    const sp = new Float32Array(gw), off = new Float32Array(gw), act = new Float32Array(gw);
    for(let x = 0; x < gw; x++){ sp[x] = 0.5 + r() * 1.2; off[x] = r() * (gh + 30); act[x] = r(); }
    s.inst = { gw, gh, sp, off, act };
  },
  draw(s, t){
    const I = s.inst; if(!I){ this.init(s); return; }
    const c = colors(), { gw, gh } = I;
    const sx = s.W / gw, sy = s.H / gh;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, s.W, s.H);
    ctx.font = `${Math.round(sy * 0.92)}px ${getComputedStyle(document.body).getPropertyValue('--mono')}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    const set = SETS[s.p.set] || SETS.binary;
    const trail = s.p.trail, speed = s.p.speed, density = s.p.density;
    const period = gh + trail;
    for(let x = 0; x < gw; x++){
      if(I.act[x] > density) continue;               // sparse columns
      const head = t * speed * I.sp[x] + I.off[x];    // falling head position (cells)
      const hi = Math.floor(head);
      for(let y = 0; y < gh; y++){
        const age = ((head - y) % period + period) % period;
        if(age >= trail) continue;
        const bright = 1 - age / trail;               // head brightest
        const ch = set[hash(x, hi - y) % set.length];
        const v = state.invert ? Math.round(255 - bright * 255) : Math.round(bright * 255);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillText(ch, (x + 0.5) * sx, (y + 0.5) * sy);
      }
    }
  },
};
