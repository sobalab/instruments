import { $ } from './utils.js';

/* ============================ canvas surfaces ============================
   Main visible plate + an offscreen buffer used by the pixel-grid instruments.
   The targets are live `let` bindings so they can be temporarily redirected
   (e.g. to render example thumbnails) via withTargets() without disturbing the
   live plate. Instruments read these at call time, so the swap is transparent. */
export let cv = $('#cv');
export let ctx = cv.getContext('2d', { alpha: false });
export let buf = document.createElement('canvas');
export let bctx = buf.getContext('2d', { alpha: false, willReadFrequently: true });

// run fn() with the drawing targets redirected, then restore them. Synchronous
// so the live render loop never interleaves with a redirected draw.
export function withTargets(target, fn){
  const saved = { cv, ctx, buf, bctx };
  cv = target.cv; ctx = target.ctx; buf = target.buf; bctx = target.bctx;
  try{ fn(); }
  finally{ cv = saved.cv; ctx = saved.ctx; buf = saved.buf; bctx = saved.bctx; }
}
