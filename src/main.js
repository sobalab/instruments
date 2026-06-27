import './styles/app.css';

import { resizePlate, reinit, setPlaying, startLoop } from './core/engine.js';
import { buildInstrumentTabs, buildParams, buildAspect } from './ui/console.js';
import { initTransport } from './ui/transport.js';
import { initCapture } from './capture/capture.js';

/* ============================ boot ============================ */
function boot(){
  resizePlate();
  buildInstrumentTabs();
  buildParams();
  buildAspect();
  reinit();

  initTransport();
  initCapture();

  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  setPlaying(!reduced);

  startLoop();
}
boot();
