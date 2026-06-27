import { cv } from '../core/canvas.js';
import { state } from '../core/state.js';
import { INSTRUMENTS } from '../instruments/index.js';
import { reinit, FIELD_LOOPABLE } from '../core/engine.js';

/* ============================ deterministic frame renderer ============================
   Renders an export off the live rAF loop: fixed FPS, fixed duration, reproducible
   from the seed. Draws on the main canvas (loop paused) at native resolution, then
   blits each frame nearest-neighbour into a scaled output canvas (1x/2x) — so the
   composition is identical and only the pixel count grows, matching the pixelated look.

   When seamless + the instrument is field-loopable, frame k uses phase = k/N over the
   chosen duration, so frame N would equal frame 0 (excluded) — a perfect loop. */

export function exportSupportsSeamless(){
  return FIELD_LOOPABLE.has(state.instrument);
}

export async function exportFrames({ fps, dur, scale = 1, seamless = false, onFrame, onProgress }){
  const def = INSTRUMENTS[state.instrument];
  const N = Math.max(1, Math.round(fps * dur));
  const dt = 1 / fps;
  const fieldLoop = seamless && FIELD_LOOPABLE.has(state.instrument);

  // snapshot live state, render deterministically from a fresh frame 0
  const saved = { clock: state.clock, playing: state.playing };
  state.playing = false;
  state.clock = 0;
  reinit();
  const b = state.bridge;

  const out = document.createElement('canvas');
  out.width = Math.round(state.W * scale);
  out.height = Math.round(state.H * scale);
  const octx = out.getContext('2d', { willReadFrequently: true });
  octx.imageSmoothingEnabled = false;

  try{
    for(let k = 0; k < N; k++){
      let t;
      if(fieldLoop){
        const phase = k / N;
        b.loop = { on: true, P: dur, phase };
        t = phase * dur;
      } else {
        b.loop = { on: false };
        t = k * dt * state.speed;
      }

      // stepped instruments (CA-style) advance their step accumulator deterministically
      if(def.step && state.inst){
        state.inst.acc = (state.inst.acc || 0) + dt * state.speed * (state.params.rate || 1);
        let guard = 0;
        while(state.inst.acc >= 1 && guard < 8){ def.step(b); state.inst.acc -= 1; guard++; }
      }

      def.draw(b, t);
      octx.drawImage(cv, 0, 0, out.width, out.height);

      await onFrame(out, k, octx);
      if(onProgress) onProgress((k + 1) / N);

      // yield to the UI so the progress overlay can paint
      if((k & 7) === 7) await new Promise(r => requestAnimationFrame(r));
    }
  } finally {
    // restore the live view
    state.clock = saved.clock;
    reinit();
    state.playing = saved.playing;
  }

  return { frames: N, width: out.width, height: out.height };
}
