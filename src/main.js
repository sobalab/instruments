import './styles/app.css';

import { resizePlate, reinit, setPlaying, startLoop } from './core/engine.js';
import { buildInstrumentTabs, buildParams, buildAspect, syncPlateControls, applyMoment } from './ui/console.js';
import { initTransport } from './ui/transport.js';
import { initShare } from './ui/share.js';
import { initPresets } from './ui/presets.js';
import { initCapture } from './capture/capture.js';
import { hashToMoment } from './core/moment.js';

/* ============================ boot ============================ */
function boot(){
  // restore a shared moment from the URL hash, if present
  const moment = hashToMoment(location.hash);

  if(moment){
    applyMoment(moment);          // sets state + builds UI to match the link
  } else {
    resizePlate();
    buildInstrumentTabs();
    buildParams();
    buildAspect();
    syncPlateControls();
    reinit();
  }

  initTransport();
  initShare();
  initPresets();
  initCapture();

  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  setPlaying(!reduced);

  startLoop();
}
boot();
