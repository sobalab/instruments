import { ctx } from '../core/canvas.js';
import { state, colors } from '../core/state.js';
import { clamp, defGrid } from '../core/utils.js';
import { loopN } from '../core/looptime.js';

/* 2 — ascii density field: monospace ramp marbling along noise */
export const ascii = {
  label: 'ASCII',
  params: [
    { key: 'cell',  label: 'Cell',       min: 7,   max: 24,  step: 1,    val: 12 },
    { key: 'scale', label: 'Flow scale', min: 0.4, max: 4,   step: 0.05, val: 1.3 },
    { key: 'warp',  label: 'Marble',     min: 0,   max: 2.5, step: 0.05, val: 1.1 },
    { key: 'gamma', label: 'Contrast',   min: 0.4, max: 2.4, step: 0.05, val: 1.1 },
    { key: 'ramp',  label: 'Glyphs', type: 'seg', options: ['soft', 'code', 'blocks'], val: 'code' },
    { key: 'tone',  label: 'Tone',   type: 'seg', options: ['mono', 'grey'], val: 'grey' },
  ],
  init(s){},
  draw(s, t){
    const c = colors();
    const ramps = { soft: " .·:-=+*", code: " .:-=+*#%@", blocks: " ░▒▓█" };
    const ramp = ramps[s.p.ramp] || ramps.code;
    const cell = s.p.cell; const { gw, gh } = defGrid(s.W, s.H, cell);
    const sx = s.W / gw, sy = s.H / gh;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, s.W, s.H);
    ctx.font = `${Math.round(sy * 0.92)}px ${getComputedStyle(document.body).getPropertyValue('--mono')}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const f = s.p.scale * 0.02, tm = t * 0.2, w = s.p.warp, vt = 0.2; // vt = d(tm)/dt
    const n2S = (x, y) => s.noise.noise2(x, y);
    const fbmS = (x, y) => s.noise.fbm(x, y, 4);
    for(let j = 0; j < gh; j++){
      for(let i = 0; i < gw; i++){
        // domain warp for the marbling look (looped so the warp itself is periodic)
        const wx = loopN(s, n2S, i * f + 5, j * f - tm, 0, -vt) - 0.5;
        const wy = loopN(s, n2S, i * f - 7, j * f + tm, 0, vt) - 0.5;
        // outer field loops on its explicit time term (tm*0.5 -> velocity 0.5*vt)
        let b = loopN(s, fbmS, i * f + wx * w + tm * 0.5, j * f + wy * w, 0.5 * vt, 0);
        b = clamp(Math.pow(b, s.p.gamma), 0, 1);
        const idx = Math.min(ramp.length - 1, Math.floor(b * ramp.length));
        const ch = ramp[idx]; if(ch === ' ') continue;
        if(s.p.tone === 'grey'){
          const v = state.invert ? Math.round(255 - b * 255) : Math.round(60 + b * 195);
          ctx.fillStyle = `rgb(${v},${v},${v})`;
        } else ctx.fillStyle = c.fg;
        ctx.fillText(ch, (i + 0.5) * sx, (j + 0.55) * sy);
      }
    }
  },
};
