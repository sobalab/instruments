import { $ } from '../core/utils.js';
import { state } from '../core/state.js';
import { reinit, setPlaying } from '../core/engine.js';
import { toast } from './toast.js';
import { scheduleHashWrite } from './share.js';

/* ============================ transport wiring ============================ */
export function initTransport(){
  $('#play').onclick = () => setPlaying(!state.playing);
  $('#overlay').onclick = () => setPlaying(true);
  $('#overlay').onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setPlaying(true); } };

  $('#randomize').onclick = () => { state.seed = (Math.random() * 1e6) | 0; reinit(); scheduleHashWrite(); toast('New seed · ' + state.seed); };
  $('#reset').onclick = () => { state.clock = 0; state.frame = 0; reinit(); toast('Reset'); };

  $('#invert').onchange = e => { state.invert = e.target.checked; if(['particles'].includes(state.instrument)) reinit(); scheduleHashWrite(); };
  $('#speed').oninput = e => { state.speed = parseFloat(e.target.value); $('#speed-v').textContent = state.speed.toFixed(2) + '×'; scheduleHashWrite(); };

  // keyboard
  window.addEventListener('keydown', e => {
    // ignore shortcuts while typing in a field (preset name, sliders, etc.)
    if(e.target.tagName === 'INPUT' || e.target.isContentEditable) return;
    if(e.key === ' '){ e.preventDefault(); setPlaying(!state.playing); }
    else if(e.key === 'r' || e.key === 'R'){ $('#randomize').click(); }
    else if(e.key === 's' || e.key === 'S'){ $('#save').click(); }
  });
}
