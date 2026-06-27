import { $ } from '../core/utils.js';
import { state } from '../core/state.js';
import { cv } from '../core/canvas.js';
import { toast } from './toast.js';
import { exportFrames, exportSupportsSeamless } from '../capture/render.js';
import { GifEncoder } from '../capture/gif.js';
import { makeZip } from '../capture/zip.js';
// mp4.js (with the mp4-muxer dependency) is lazy-loaded on first MP4 export

/* ============================ export panel ============================ */

const FORMATS = [
  { k: 'png',    label: 'PNG' },
  { k: 'pngseq', label: 'PNG seq' },
  { k: 'gif',    label: 'GIF' },
  { k: 'mp4',    label: 'MP4' },
];
const FPS_OPTS = [12, 24, 30];
const SIZE_OPTS = [1, 2];
const ANIMATED = new Set(['pngseq', 'gif', 'mp4']);

const sel = { format: 'gif', fps: 24, size: 1 };
let busy = false;

function downloadBlob(blob, filename){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

const canvasToBlob = (canvas, type) => new Promise(res => canvas.toBlob(res, type));

function buildSeg(host, items, getLabel, getValue, current, onPick){
  host.innerHTML = '';
  items.forEach(it => {
    const b = document.createElement('button');
    b.textContent = getLabel(it);
    b.setAttribute('aria-pressed', getValue(it) === current());
    b.onclick = () => {
      onPick(getValue(it));
      host.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.textContent === getLabel(it)));
    };
    host.appendChild(b);
  });
}

function refreshAnimVisibility(){
  const anim = ANIMATED.has(sel.format);
  document.querySelectorAll('.ex-anim').forEach(e => { e.style.display = anim ? '' : 'none'; });
}

function refreshSeamless(){
  const supported = exportSupportsSeamless();
  const box = $('#ex-seamless');
  box.disabled = !supported;
  box.closest('.toggle').style.opacity = supported ? '1' : '0.45';
  if(!supported) box.checked = false;
  else box.checked = state.loop.on; // default to the live loop setting
}

function setProgress(p){
  const wrap = $('#ex-progress');
  if(p == null){ wrap.hidden = true; return; }
  wrap.hidden = false;
  $('#ex-bar-fill').style.width = Math.round(p * 100) + '%';
  $('#ex-pct').textContent = Math.round(p * 100) + '%';
}

async function exportStill(){
  const out = document.createElement('canvas');
  out.width = state.W * sel.size; out.height = state.H * sel.size;
  const octx = out.getContext('2d'); octx.imageSmoothingEnabled = false;
  octx.drawImage(cv, 0, 0, out.width, out.height);
  const blob = await canvasToBlob(out, 'image/png');
  downloadBlob(blob, `drift_${state.instrument}_${state.seed}@${sel.size}x.png`);
  toast('Saved PNG · ' + sel.size + '×');
}

async function exportGif(dur, seamless){
  const enc = new GifEncoder({ width: state.W * sel.size, height: state.H * sel.size, fps: sel.fps, loop: 0 });
  await exportFrames({
    fps: sel.fps, dur, scale: sel.size, seamless,
    onFrame: (out, k, octx) => { enc.addFrame(octx.getImageData(0, 0, out.width, out.height)); },
    onProgress: setProgress,
  });
  downloadBlob(enc.finish(), `drift_${state.instrument}_${state.seed}.gif`);
  toast('Saved GIF' + (seamless ? ' · seamless loop' : ''));
}

async function exportMp4Clip(dur, seamless){
  const { exportMp4, hasWebCodecs } = await import('../capture/mp4.js');
  if(!hasWebCodecs()){
    toast('MP4 not supported here — try GIF or Record clip');
    return;
  }
  try{
    const blob = await exportMp4({ fps: sel.fps, dur, scale: sel.size, seamless, onProgress: setProgress });
    downloadBlob(blob, `drift_${state.instrument}_${state.seed}.mp4`);
    toast('Saved MP4' + (seamless ? ' · seamless loop' : ''));
  }catch(err){
    if(err && (err.message === 'no-webcodecs' || err.message === 'no-avc')){
      toast('MP4 (H.264) unavailable here — try GIF or Record clip');
    } else throw err;
  }
}

async function exportPngSeq(dur, seamless){
  const files = [];
  await exportFrames({
    fps: sel.fps, dur, scale: sel.size, seamless,
    onFrame: async (out, k) => {
      const blob = await canvasToBlob(out, 'image/png');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      files.push({ name: `drift_${state.seed}_${String(k).padStart(4, '0')}.png`, data: bytes });
    },
    onProgress: setProgress,
  });
  downloadBlob(makeZip(files), `drift_${state.instrument}_${state.seed}_seq.zip`);
  toast(`Saved ${files.length} frames · zip`);
}

async function run(){
  if(busy) return;
  busy = true;
  const go = $('#ex-go'); go.disabled = true;
  try{
    if(sel.format === 'png'){
      await exportStill();
    } else {
      const dur = parseFloat($('#ex-dur').value);
      const seamless = $('#ex-seamless').checked && exportSupportsSeamless();
      setProgress(0);
      if(sel.format === 'gif') await exportGif(dur, seamless);
      else if(sel.format === 'mp4') await exportMp4Clip(dur, seamless);
      else if(sel.format === 'pngseq') await exportPngSeq(dur, seamless);
    }
  }catch(err){
    console.error(err);
    toast('Export failed');
  }finally{
    setProgress(null);
    go.disabled = false;
    busy = false;
  }
}

export function initExport(){
  buildSeg($('#ex-format'), FORMATS, f => f.label, f => f.k, () => sel.format,
    v => { sel.format = v; refreshAnimVisibility(); });
  buildSeg($('#ex-fps'), FPS_OPTS, n => String(n), n => n, () => sel.fps, v => { sel.fps = v; });
  buildSeg($('#ex-size'), SIZE_OPTS, n => n + '×', n => n, () => sel.size, v => { sel.size = v; });

  $('#ex-dur').oninput = e => { $('#ex-dur-v').textContent = parseFloat(e.target.value).toFixed(1) + 's'; };
  $('#ex-go').onclick = run;

  refreshAnimVisibility();
  refreshSeamless();
  window.addEventListener('drift:instrument', refreshSeamless);
}
