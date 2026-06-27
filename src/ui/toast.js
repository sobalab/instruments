import { $ } from '../core/utils.js';

/* ============================ toast ============================ */
let toastT;
export function toast(msg){
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1600);
}
