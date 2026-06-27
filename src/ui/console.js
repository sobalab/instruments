import { $ } from '../core/utils.js';
import { state, ASPECTS } from '../core/state.js';
import { INSTRUMENTS } from '../instruments/index.js';
import { reinit, resizePlate } from '../core/engine.js';
import { scheduleHashWrite } from './share.js';

/* ============================ console builders ============================ */

export function buildInstrumentTabs(){
  const nav = $('#instruments'); nav.innerHTML = '';
  Object.keys(INSTRUMENTS).forEach(key => {
    const b = document.createElement('button');
    b.className = 'inst-btn'; b.textContent = INSTRUMENTS[key].label;
    b.setAttribute('aria-pressed', key === state.instrument);
    b.onclick = () => selectInstrument(key);
    nav.appendChild(b);
  });
}

export function selectInstrument(key){
  state.instrument = key;
  document.querySelectorAll('.inst-btn').forEach((b, i) => {
    b.setAttribute('aria-pressed', Object.keys(INSTRUMENTS)[i] === key);
  });
  buildParams();
  reinit();
  scheduleHashWrite();
}

// build the param controls. `values` optionally overrides each param's default
// (used when restoring a shared/preset moment) so sliders reflect the moment.
export function buildParams(values){
  const wrap = $('#params'); wrap.innerHTML = '';
  state.params = {};
  const def = INSTRUMENTS[state.instrument];
  def.params.forEach(pr => {
    const initial = (values && pr.key in values) ? values[pr.key] : pr.val;
    state.params[pr.key] = initial;
    const ctrl = document.createElement('div'); ctrl.className = 'ctrl';

    if(pr.type === 'seg'){
      const row = document.createElement('div'); row.className = 'ctrl-row';
      row.innerHTML = `<span class="ctrl-label">${pr.label}</span>`;
      ctrl.appendChild(row);
      const seg = document.createElement('div'); seg.className = 'seg';
      pr.options.forEach(opt => {
        const b = document.createElement('button');
        b.textContent = opt; b.setAttribute('aria-pressed', opt === initial);
        b.onclick = () => {
          state.params[pr.key] = opt;
          seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.textContent === opt));
          if(needsReinit(pr.key)) reinit();
          scheduleHashWrite();
        };
        seg.appendChild(b);
      });
      ctrl.appendChild(seg);
    } else {
      const row = document.createElement('div'); row.className = 'ctrl-row';
      const valFmt = v => (pr.step < 1 ? Number(v).toFixed(2) : String(v));
      row.innerHTML = `<span class="ctrl-label">${pr.label}</span><span class="ctrl-val">${valFmt(initial)}</span>`;
      ctrl.appendChild(row);
      const inp = document.createElement('input');
      inp.type = 'range'; inp.min = pr.min; inp.max = pr.max; inp.step = pr.step; inp.value = initial;
      inp.setAttribute('aria-label', pr.label);
      inp.oninput = () => {
        const v = parseFloat(inp.value); state.params[pr.key] = v;
        row.querySelector('.ctrl-val').textContent = valFmt(v);
        if(needsReinit(pr.key)) reinit();
        scheduleHashWrite();
      };
      ctrl.appendChild(inp);
    }
    wrap.appendChild(ctrl);
  });
}

// params that change grid topology / seeded buffers require a re-init
export function needsReinit(key){
  if(['automata', 'dither', 'particles'].includes(state.instrument)){
    return ['cell', 'states', 'count'].includes(key);
  }
  return false;
}

export function buildAspect(){
  const seg = $('#aspect'); seg.innerHTML = '';
  Object.keys(ASPECTS).forEach(k => {
    const b = document.createElement('button');
    b.textContent = k; b.setAttribute('aria-pressed', k === state.aspect);
    b.onclick = () => {
      state.aspect = k;
      seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.textContent === k));
      resizePlate(); reinit();
      scheduleHashWrite();
    };
    seg.appendChild(b);
  });
}

// sync the Plate-group controls (invert + speed) to current state
export function syncPlateControls(){
  $('#invert').checked = state.invert;
  $('#speed').value = state.speed;
  $('#speed-v').textContent = state.speed.toFixed(2) + '×';
}

/* restore a full moment (shared link or preset) into the UI + engine */
export function applyMoment(m){
  if(!m) return;
  if(m.instrument && INSTRUMENTS[m.instrument]) state.instrument = m.instrument;
  if(typeof m.seed === 'number') state.seed = m.seed;
  if(m.aspect && ASPECTS[m.aspect]) state.aspect = m.aspect;
  if(typeof m.invert === 'boolean') state.invert = m.invert;
  if(typeof m.speed === 'number') state.speed = m.speed;
  if(m.loop){
    if(typeof m.loop.on === 'boolean') state.loop.on = m.loop.on;
    if(typeof m.loop.dur === 'number') state.loop.dur = m.loop.dur;
  }
  buildInstrumentTabs();
  buildParams(m.params);
  buildAspect();
  syncPlateControls();
  resizePlate();
  reinit();
}
