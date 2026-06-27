import { $ } from '../core/utils.js';
import { state } from '../core/state.js';
import { scheduleHashWrite } from './share.js';

/* ============================ loop controls ============================ */

export function syncLoopControls(){
  $('#loop-on').checked = state.loop.on;
  $('#loop-dur').value = state.loop.dur;
  $('#loop-dur-v').textContent = Number(state.loop.dur).toFixed(1) + 's';
}

export function initLoop(){
  $('#loop-on').onchange = e => { state.loop.on = e.target.checked; scheduleHashWrite(); };
  $('#loop-dur').oninput = e => {
    state.loop.dur = parseFloat(e.target.value);
    $('#loop-dur-v').textContent = state.loop.dur.toFixed(1) + 's';
    scheduleHashWrite();
  };
  syncLoopControls();
}
