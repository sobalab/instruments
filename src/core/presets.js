/* ============================ preset storage ============================
   Named moments persisted in localStorage. Pure storage layer — no DOM. */
const KEY = 'drift.presets.v1';

export function listPresets(){
  try{ return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch{ return []; }
}

function write(arr){
  try{ localStorage.setItem(KEY, JSON.stringify(arr)); }
  catch{ /* storage full / disabled — fail quietly */ }
}

export function savePreset(name, moment){
  const arr = listPresets().filter(p => p.name !== name); // replace same-named
  arr.push({ name, moment });
  write(arr);
  return arr;
}

export function removePreset(name){
  const arr = listPresets().filter(p => p.name !== name);
  write(arr);
  return arr;
}
