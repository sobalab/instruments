import { state, ASPECTS } from './state.js';
import { INSTRUMENTS } from '../instruments/index.js';
import { clamp } from './utils.js';

/* ============================ moment (de)serialization ============================
   A "moment" is the full reproducible state of a visual:
   instrument, all its params, seed, aspect, invert, speed, loop.
   It round-trips through the URL hash so any moment is a shareable link. */

// snapshot the current studio state into a plain moment object
export function currentMoment(){
  return {
    instrument: state.instrument,
    seed: state.seed,
    aspect: state.aspect,
    invert: state.invert,
    speed: state.speed,
    params: { ...state.params },
    loop: { on: state.loop.on, dur: state.loop.dur },
  };
}

// moment -> compact hash string (no leading '#')
export function momentToHash(m){
  const q = new URLSearchParams();
  q.set('i', m.instrument);
  q.set('s', String(m.seed));
  q.set('a', m.aspect);
  q.set('inv', m.invert ? '1' : '0');
  q.set('sp', String(m.speed));
  q.set('lp', m.loop && m.loop.on ? '1' : '0');
  if(m.loop) q.set('ld', String(m.loop.dur));
  for(const k in m.params) q.set('p_' + k, String(m.params[k]));
  return q.toString();
}

// hash string -> validated moment object (or null if it carries no instrument)
export function hashToMoment(hash){
  const str = (hash || '').replace(/^#/, '');
  if(!str) return null;
  const q = new URLSearchParams(str);
  const inst = q.get('i');
  if(!inst || !INSTRUMENTS[inst]) return null;

  const m = { instrument: inst, params: {}, loop: {} };

  if(q.has('s')){ const n = parseInt(q.get('s'), 10); if(Number.isFinite(n)) m.seed = n; }
  if(q.has('a') && ASPECTS[q.get('a')]) m.aspect = q.get('a');
  if(q.has('inv')) m.invert = q.get('inv') === '1';
  if(q.has('sp')){ const n = parseFloat(q.get('sp')); if(Number.isFinite(n)) m.speed = clamp(n, 0, 3); }
  if(q.has('lp')) m.loop.on = q.get('lp') === '1';
  if(q.has('ld')){ const n = parseFloat(q.get('ld')); if(Number.isFinite(n)) m.loop.dur = clamp(n, 1, 60); }

  // params are validated against the target instrument's descriptors
  for(const def of INSTRUMENTS[inst].params){
    const key = 'p_' + def.key;
    if(!q.has(key)) continue;
    const raw = q.get(key);
    if(def.type === 'seg'){
      if(def.options.includes(raw)) m.params[def.key] = raw;
    } else {
      const n = parseFloat(raw);
      if(Number.isFinite(n)) m.params[def.key] = clamp(n, def.min, def.max);
    }
  }
  return m;
}
