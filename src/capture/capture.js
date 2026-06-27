import { $ } from '../core/utils.js';
import { cv } from '../core/canvas.js';
import { state } from '../core/state.js';
import { setPlaying, setFrameHook } from '../core/engine.js';
import { toast } from '../ui/toast.js';

/* ============================ capture ============================ */

// save still frame (PNG via toBlob)
function saveFrame(){
  cv.toBlob(b => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `drift_${state.instrument}_${state.seed}.png`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Saved frame');
  }, 'image/png');
}

// record clip (WebM via captureStream + MediaRecorder)
const rec = { active: false, mr: null, chunks: [], t0: 0 };

function startRec(){
  if(!cv.captureStream || typeof MediaRecorder === 'undefined'){ toast('Recording not supported in this browser'); return; }
  let mime = 'video/webm;codecs=vp9';
  if(!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=vp8';
  if(!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
  try{
    const stream = cv.captureStream(60);
    rec.chunks = []; rec.mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
    rec.mr.ondataavailable = e => { if(e.data.size) rec.chunks.push(e.data); };
    rec.mr.onstop = () => {
      const blob = new Blob(rec.chunks, { type: 'video/webm' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `drift_${state.instrument}_${state.seed}.webm`;
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      toast('Saved clip · .webm');
    };
    rec.mr.start();
    rec.active = true; rec.t0 = performance.now();
    $('#record').setAttribute('aria-pressed', 'true'); $('#record').textContent = '■ Stop';
    $('#ro-rec').classList.add('on');
    if(!state.playing) setPlaying(true);
  }catch(err){ toast('Could not start recording'); }
}

function stopRec(){
  if(rec.mr && rec.mr.state !== 'inactive') rec.mr.stop();
  rec.active = false;
  $('#record').setAttribute('aria-pressed', 'false'); $('#record').textContent = '● Record clip';
  $('#ro-rec').classList.remove('on');
}

export function initCapture(){
  $('#save').onclick = saveFrame;
  $('#record').onclick = () => { rec.active ? stopRec() : startRec(); };
  // keep the REC timer readout ticking with the engine clock
  setFrameHook(() => {
    if(rec.active){ const e = (performance.now() - rec.t0) / 1000; $('#ro-rectime').textContent = e.toFixed(1) + 's'; }
  });
}

export { saveFrame };
