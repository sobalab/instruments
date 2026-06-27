import { $ } from './utils.js';
import { cv } from './canvas.js';
import { state, ASPECTS } from './state.js';
import { makeNoise } from './noise.js';
import { INSTRUMENTS } from '../instruments/index.js';

/* ============================ engine ============================ */

export function resizePlate(){
  const [w, h] = ASPECTS[state.aspect];
  state.W = w; state.H = h; cv.width = w; cv.height = h;
  $('#plate').style.aspectRatio = `${w}/${h}`;
  $('#ro-size').textContent = `${w}×${h}`;
}

export function reinit(){
  state.noise = makeNoise(state.seed);
  state.inst = null;
  const def = INSTRUMENTS[state.instrument];
  state.bridge = {
    W: state.W, H: state.H, seed: state.seed, noise: state.noise,
    loop: { on: false },
    get p(){ return state.params; },
    get inst(){ return state.inst; }, set inst(v){ state.inst = v; },
  };
  if(def.init) def.init(state.bridge);
  $('#ro-algo').textContent = def.label.toLowerCase();
  $('#ro-seed').textContent = state.seed;
}

// instruments whose preview/export can loop seamlessly (pure functions of time)
export const FIELD_LOOPABLE = new Set(['strokes', 'ascii', 'dither']);

// per-frame hook (used by capture to update the REC readout) — keeps capture
// decoupled from the engine loop.
let frameHook = null;
export function setFrameHook(fn){ frameHook = fn; }

let last = 0;
function frame(ts){
  requestAnimationFrame(frame);
  if(!last) last = ts;
  let dt = (ts - last) / 1000; last = ts; if(dt > 0.1) dt = 0.1;
  if(!state.playing) return;
  state.clock += dt * state.speed;
  const b = state.bridge;
  b.W = state.W; b.H = state.H;

  // loop phase: τ = phase·P feeds the loopable field instruments so the visual
  // depends only on phase (a true seamless loop). Others keep continuous time.
  let t = state.clock;
  if(state.loop.on){
    const P = state.loop.dur;
    const phase = (((state.clock % P) + P) % P) / P;
    const fieldLoop = FIELD_LOOPABLE.has(state.instrument);
    b.loop = { on: fieldLoop, P, phase };
    if(fieldLoop) t = phase * P;
    $('#ro-loop').textContent = Math.round(phase * 100) + '%';
    $('#ro-looptag').classList.add('on');
  } else {
    b.loop = { on: false };
    $('#ro-looptag').classList.remove('on');
  }

  const def = INSTRUMENTS[state.instrument];
  // stepped instruments (CA-style) advance on their own step accumulator
  if(def.step && state.inst){
    state.inst.acc = (state.inst.acc || 0) + dt * state.speed * (state.params.rate || 1);
    let guard = 0;
    while(state.inst.acc >= 1 && guard < 8){ def.step(b); state.inst.acc -= 1; guard++; }
  }
  def.draw(b, t);
  state.frame++;
  $('#ro-frame').textContent = String(state.frame % 10000).padStart(4, '0');
  if(frameHook) frameHook();
}

export function setPlaying(v){
  state.playing = v;
  $('#play').setAttribute('aria-pressed', v);
  $('#play-label').textContent = v ? 'Pause' : 'Play';
  $('#overlay').classList.toggle('show', !v);
  if(v) last = 0;
}

export function startLoop(){
  requestAnimationFrame(frame);
}
