import { $ } from '../core/utils.js';
import { INSTRUMENTS } from '../instruments/index.js';
import { makeNoise } from '../core/noise.js';
import { withTargets } from '../core/canvas.js';
import { hashToMoment } from '../core/moment.js';
import { applyMoment } from './console.js';

/* ============================ landing ============================
   A few curated example moments, each a real shareable permalink, shown as
   live-rendered thumbnails. Clicking one loads it into the studio. */

const EXAMPLES = [
  { label: 'Curl field',     hash: 'i=strokes&s=2024&p_cell=14&p_scale=1.6&p_turns=2&p_len=0.7&p_thin=1.2' },
  { label: 'Dithered drift', hash: 'i=dither&s=7777&lp=1&ld=6&p_cell=4&p_scale=1.1&p_streak=6&p_drift=1.2&p_gamma=1.05' },
  { label: 'Rule 30',        hash: 'i=wolfram&s=30030&p_cell=4&p_rule=30&p_rate=14&p_density=0.06&p_wrap=void' },
  { label: 'Binary rain',    hash: 'i=bits&s=101&p_cell=14&p_speed=1.4&p_density=0.85&p_trail=16&p_set=binary' },
];

// render one moment into a small offscreen-style canvas, without touching the plate
function renderThumb(moment, canvas){
  const inst = INSTRUMENTS[moment.instrument];
  if(!inst) return;
  const W = canvas.width, H = canvas.height;
  const tctx = canvas.getContext('2d', { alpha: false });
  const tbuf = document.createElement('canvas');
  const tbctx = tbuf.getContext('2d', { alpha: false, willReadFrequently: true });

  const p = {};
  inst.params.forEach(pr => { p[pr.key] = (moment.params && pr.key in moment.params) ? moment.params[pr.key] : pr.val; });
  const seed = typeof moment.seed === 'number' ? moment.seed : 12345;
  const bridge = { W, H, seed, noise: makeNoise(seed), p, inst: null, loop: { on: false } };

  withTargets({ cv: canvas, ctx: tctx, buf: tbuf, bctx: tbctx }, () => {
    if(inst.init) inst.init(bridge);
    if(inst.step && bridge.inst){
      const steps = Math.min(140, bridge.inst.gh || 0);
      for(let i = 0; i < steps; i++) inst.step(bridge);
    }
    inst.draw(bridge, 8);
  });
}

function buildCards(){
  const host = $('#examples'); if(!host) return;
  host.innerHTML = '';
  EXAMPLES.forEach(ex => {
    const moment = hashToMoment('#' + ex.hash);
    const a = document.createElement('a');
    a.className = 'ex-card';
    a.href = '#' + ex.hash;

    const thumb = document.createElement('span'); thumb.className = 'ex-thumb';
    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 320;
    thumb.appendChild(canvas);
    for(const c of ['tl', 'tr', 'bl', 'br']){ const m = document.createElement('span'); m.className = 'ex-mark ex-' + c; thumb.appendChild(m); }

    const meta = document.createElement('span'); meta.className = 'ex-meta';
    meta.innerHTML = `<b>${ex.label}</b><span>${moment ? moment.instrument : ''}</span>`;

    a.appendChild(thumb); a.appendChild(meta);
    a.onclick = e => {
      e.preventDefault();
      if(moment){ applyMoment(moment); history.replaceState(null, '', '#' + ex.hash); }
      $('#studio').scrollIntoView({ behavior: 'smooth' });
    };
    host.appendChild(a);

    if(moment) renderThumb(moment, canvas);
  });
}

export function initLanding(){
  const cta = $('#to-studio');
  if(cta) cta.onclick = e => { e.preventDefault(); $('#studio').scrollIntoView({ behavior: 'smooth' }); };
  // wait for the display fonts so glyph-based thumbs (bits) render crisply
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(buildCards);
  else buildCards();
}
