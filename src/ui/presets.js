import { $ } from '../core/utils.js';
import { currentMoment } from '../core/moment.js';
import { applyMoment } from './console.js';
import { toast } from './toast.js';
import { scheduleHashWrite } from './share.js';
import { listPresets, savePreset, removePreset } from '../core/presets.js';

/* ============================ preset strip ============================ */

function render(){
  const strip = $('#preset-strip'); strip.innerHTML = '';
  const arr = listPresets();
  if(!arr.length){
    const e = document.createElement('span'); e.className = 'preset-empty';
    e.textContent = 'no presets yet';
    strip.appendChild(e); return;
  }
  arr.forEach(p => {
    const chip = document.createElement('span'); chip.className = 'preset-chip';

    const load = document.createElement('button');
    load.className = 'preset-load'; load.textContent = p.name; load.title = 'Load ' + p.name;
    load.onclick = () => { applyMoment(p.moment); scheduleHashWrite(); toast('Loaded · ' + p.name); };

    const del = document.createElement('button');
    del.className = 'preset-x'; del.textContent = '✕';
    del.setAttribute('aria-label', 'Delete preset ' + p.name);
    del.onclick = () => { removePreset(p.name); render(); toast('Removed · ' + p.name); };

    chip.appendChild(load); chip.appendChild(del); strip.appendChild(chip);
  });
}

export function initPresets(){
  const name = $('#preset-name');
  const doSave = () => {
    const n = (name.value || '').trim().slice(0, 24);
    if(!n){ toast('Name the preset first'); name.focus(); return; }
    savePreset(n, currentMoment()); name.value = ''; render();
    toast('Saved · ' + n);
  };
  $('#preset-save').onclick = doSave;
  name.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); doSave(); } });
  render();
}
