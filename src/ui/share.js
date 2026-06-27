import { $ } from '../core/utils.js';
import { currentMoment, momentToHash } from '../core/moment.js';
import { toast } from './toast.js';

/* ============================ share / permalink ============================ */

// keep the address bar in sync with the live moment (no history spam)
let writeT;
export function scheduleHashWrite(){
  clearTimeout(writeT);
  writeT = setTimeout(() => {
    const hash = '#' + momentToHash(currentMoment());
    history.replaceState(null, '', hash);
  }, 200);
}

function permalink(){
  return location.origin + location.pathname + '#' + momentToHash(currentMoment());
}

async function copyLink(){
  const url = permalink();
  // mirror it to the address bar immediately so a manual reload also restores
  history.replaceState(null, '', '#' + momentToHash(currentMoment()));
  try{
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(url);
    } else {
      const ta = document.createElement('textarea');
      ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    toast('Link copied');
  }catch(err){
    toast('Copy failed — link is in the address bar');
  }
}

export function initShare(){
  $('#copylink').onclick = copyLink;
}
