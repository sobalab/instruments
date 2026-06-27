import { ctx, buf, bctx } from '../core/canvas.js';
import { state, colors } from '../core/state.js';
import { clamp, defGrid } from '../core/utils.js';

/* 4 — dithered drift: horizontally streaking 1-bit noise (Bayer 4x4) */
export const dither = {
  label: 'Dither',
  params: [
    { key: 'cell',   label: 'Pixel',       min: 2,   max: 10,  step: 1,    val: 4 },
    { key: 'scale',  label: 'Noise scale', min: 0.3, max: 3,   step: 0.05, val: 1 },
    { key: 'streak', label: 'Streak',      min: 1,   max: 10,  step: 0.2,  val: 4.5 },
    { key: 'drift',  label: 'Drift',       min: 0,   max: 3,   step: 0.05, val: 1 },
    { key: 'gamma',  label: 'Contrast',    min: 0.4, max: 2.4, step: 0.05, val: 1.05 },
  ],
  init(s){
    const { gw, gh } = defGrid(s.W, s.H, s.p.cell);
    s.inst = { gw, gh, img: bctx.createImageData(gw, gh) };
  },
  draw(s, t){
    const { gw, gh } = defGrid(s.W, s.H, s.p.cell);
    if(!s.inst || s.inst.gw !== gw || s.inst.gh !== gh) s.inst = { gw, gh, img: bctx.createImageData(gw, gh) };
    const I = s.inst, data = I.img.data;
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const c = colors();
    const fx = s.p.scale * 0.05 / s.p.streak, fy = s.p.scale * 0.05;
    const tm = t * 0.25, dx = t * s.p.drift * 0.6;
    for(let y = 0; y < gh; y++){
      for(let x = 0; x < gw; x++){
        let n = s.noise.fbm((x * fx) + dx, (y * fy) - tm * 0.3, 4);
        // slight vertical contour warp
        n = 0.5 * n + 0.5 * s.noise.noise2(x * fx * 0.5 + dx * 0.4, y * fy * 1.6 + tm * 0.2);
        n = clamp(Math.pow(n, s.p.gamma), 0, 1);
        const thr = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
        let v = n > thr ? 255 : 0;
        if(state.invert) v = 255 - v;
        const o = (y * gw + x) * 4; data[o] = data[o + 1] = data[o + 2] = v; data[o + 3] = 255;
      }
    }
    buf.width = gw; buf.height = gh; bctx.putImageData(I.img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, s.W, s.H);
    ctx.drawImage(buf, 0, 0, s.W, s.H);
  },
};
