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
    get p(){ return state.params; },
    get inst(){ return state.inst; }, set inst(v){ state.inst = v; },
  };
  if(def.init) def.init(state.bridge);
  $('#ro-algo').textContent = def.label.toLowerCase();
  $('#ro-seed').textContent = state.seed;
}

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
  state.bridge.W = state.W; state.bridge.H = state.H;

  const def = INSTRUMENTS[state.instrument];
  // automata advances on its own step accumulator
  if(state.instrument === 'automata' && state.inst){
    state.inst.acc += dt * state.speed * state.params.rate;
    let guard = 0;
    while(state.inst.acc >= 1 && guard < 6){ def.step(state.bridge); state.inst.acc -= 1; guard++; }
  }
  def.draw(state.bridge, state.clock);
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
