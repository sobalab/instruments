import { ctx } from '../core/canvas.js';
import { state, colors } from '../core/state.js';
import { TAU } from '../core/utils.js';
import { mulberry32 } from '../core/rng.js';

/* 5 — particles: flow-field ribbons with fading trails */
export const particles = {
  label: 'Particles',
  params: [
    { key: 'count', label: 'Count',      min: 300, max: 6000, step: 100,  val: 2200 },
    { key: 'scale', label: 'Flow scale', min: 0.4, max: 4,    step: 0.05, val: 1.3 },
    { key: 'speed', label: 'Drift',      min: 0.2, max: 4,    step: 0.05, val: 1.4 },
    { key: 'trail', label: 'Trail',      min: 0,   max: 0.5,  step: 0.01, val: 0.08 },
    { key: 'size',  label: 'Size',       min: 0.5, max: 3,    step: 0.1,  val: 1 },
  ],
  init(s){
    const r = mulberry32(s.seed ^ 0x51ed);
    const n = 6000; const P = new Float32Array(n * 2);
    for(let i = 0; i < n; i++){ P[i * 2] = r() * s.W; P[i * 2 + 1] = r() * s.H; }
    s.inst = { P, primed: false };
  },
  draw(s, t){
    const I = s.inst; if(!I){ this.init(s); return; }
    const c = colors(), P = I.P, count = s.p.count | 0;
    if(!I.primed){ ctx.fillStyle = c.bg; ctx.fillRect(0, 0, s.W, s.H); I.primed = true; }
    // fade prior frame toward bg
    ctx.fillStyle = state.invert
      ? `rgba(255,255,255,${s.p.trail})` : `rgba(0,0,0,${s.p.trail})`;
    ctx.fillRect(0, 0, s.W, s.H);
    ctx.fillStyle = c.fg;
    const f = s.p.scale * 0.0016, sp = s.p.speed * Math.min(s.W, s.H) * 0.004;
    const sz = s.p.size;
    for(let i = 0; i < count; i++){
      let x = P[i * 2], y = P[i * 2 + 1];
      const a = s.noise.fbm(x * f + t * 0.05, y * f - t * 0.03, 3) * TAU * 2;
      x += Math.cos(a) * sp; y += Math.sin(a) * sp;
      if(x < 0) x += s.W; else if(x >= s.W) x -= s.W;
      if(y < 0) y += s.H; else if(y >= s.H) y -= s.H;
      P[i * 2] = x; P[i * 2 + 1] = y;
      ctx.fillRect(x, y, sz, sz);
    }
  },
};
