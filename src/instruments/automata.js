import { ctx, buf, bctx } from '../core/canvas.js';
import { state, colors } from '../core/state.js';
import { defGrid } from '../core/utils.js';
import { mulberry32 } from '../core/rng.js';

/* 3 — cyclic cellular automaton: 1-bit woven interference + sparks */
export const automata = {
  label: 'Automata',
  params: [
    { key: 'cell',   label: 'Cell',      min: 3, max: 14, step: 1, val: 5 },
    { key: 'states', label: 'States',    min: 3, max: 16, step: 1, val: 6 },
    { key: 'thresh', label: 'Threshold', min: 1, max: 4,  step: 1, val: 1 },
    { key: 'rate',   label: 'Step rate', min: 1, max: 30, step: 1, val: 12 },
    { key: 'render', label: 'Render', type: 'seg', options: ['1-bit', 'grey'], val: '1-bit' },
  ],
  init(s){
    const { gw, gh } = defGrid(s.W, s.H, s.p.cell);
    s.inst = { gw, gh, acc: 0,
      a: new Uint8Array(gw * gh), b: new Uint8Array(gw * gh) };
    const r = mulberry32(s.seed ^ 0x9e37);
    for(let k = 0; k < gw * gh; k++) s.inst.a[k] = (r() * s.p.states) | 0;
    s.inst.img = bctx.createImageData(gw, gh);
  },
  step(s){
    const I = s.inst, gw = I.gw, gh = I.gh, N = s.p.states, th = s.p.thresh;
    const a = I.a, b = I.b;
    for(let y = 0; y < gh; y++){
      for(let x = 0; x < gw; x++){
        const idx = y * gw + x, cur = a[idx], next = (cur + 1) % N;
        let cnt = 0;
        // Moore neighbourhood (toroidal)
        for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){
          if(!dx && !dy) continue;
          const nx = (x + dx + gw) % gw, ny = (y + dy + gh) % gh;
          if(a[ny * gw + nx] === next) cnt++;
        }
        b[idx] = cnt >= th ? next : cur;
      }
    }
    I.a = b; I.b = a;
  },
  draw(s, t){
    const I = s.inst; if(!I) return;
    const c = colors(), img = I.img.data, a = I.a, N = s.p.states;
    for(let k = 0; k < a.length; k++){
      let v;
      if(s.p.render === '1-bit'){ v = a[k] === 0 ? 255 : 0; }
      else { v = Math.round((a[k] / (N - 1)) * 255); }
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
