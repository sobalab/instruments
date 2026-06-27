import { ctx } from '../core/canvas.js';
import { colors } from '../core/state.js';
import { TAU, defGrid } from '../core/utils.js';

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
    const f = s.p.scale * 0.012, tm = t * 0.18;
    for(let j = 0; j < gh; j++){
      for(let i = 0; i < gw; i++){
        const x = (i + 0.5) * sx, y = (j + 0.5) * sy;
        const a = (s.noise.fbm(i * f * sx + tm, j * f * sy - tm * 0.6, 3)) * TAU * s.p.turns;
        const m = s.noise.noise2(i * f * sx * 0.5 + 99, j * f * sy * 0.5 - tm); // length modulation
        const L = step * s.p.len * (0.25 + m);
        const dx = Math.cos(a) * L * 0.5, dy = Math.sin(a) * L * 0.5;
        ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy);
      }
    }
    ctx.stroke();
  },
};
