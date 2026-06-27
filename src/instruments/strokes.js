import { ctx } from '../core/canvas.js';
import { colors } from '../core/state.js';
import { TAU, defGrid } from '../core/utils.js';
import { loopN } from '../core/looptime.js';

/* 1 — flow strokes: dashes pivoting along a noise field */
export const strokes = {
  label: 'Strokes',
  params: [
    { key: 'cell',  label: 'Spacing',    min: 8,   max: 40, step: 1,    val: 16 },
    { key: 'scale', label: 'Flow scale', min: 0.4, max: 4,  step: 0.05, val: 1.4 },
    { key: 'turns', label: 'Curl',       min: 0.5, max: 4,  step: 0.05, val: 1.6 },
    { key: 'len',   label: 'Length',     min: 0.2, max: 1,  step: 0.02, val: 0.62 },
    { key: 'thin',  label: 'Weight',     min: 0.5, max: 3,  step: 0.1,  val: 1.2 },
  ],
  init(s){},
  draw(s, t){
    const c = colors(), { gw, gh } = defGrid(s.W, s.H, s.p.cell);
    const sx = s.W / gw, sy = s.H / gh, step = Math.min(sx, sy);
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, s.W, s.H);
    ctx.strokeStyle = c.fg; ctx.lineWidth = s.p.thin; ctx.lineCap = 'round';
    ctx.beginPath();
    const f = s.p.scale * 0.012, tm = t * 0.18, vt = 0.18; // vt = d(tm)/dt, for seamless looping
    const fbmS = (x, y) => s.noise.fbm(x, y, 3);
    const n2S = (x, y) => s.noise.noise2(x, y);
    for(let j = 0; j < gh; j++){
      for(let i = 0; i < gw; i++){
        const x = (i + 0.5) * sx, y = (j + 0.5) * sy;
        const a = loopN(s, fbmS, i * f * sx + tm, j * f * sy - tm * 0.6, vt, -0.6 * vt) * TAU * s.p.turns;
        const m = loopN(s, n2S, i * f * sx * 0.5 + 99, j * f * sy * 0.5 - tm, 0, -vt); // length modulation
        const L = step * s.p.len * (0.25 + m);
        const dx = Math.cos(a) * L * 0.5, dy = Math.sin(a) * L * 0.5;
        ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy);
      }
    }
    ctx.stroke();
  },
};
