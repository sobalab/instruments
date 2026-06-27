import { $ } from './utils.js';

/* ============================ canvas surfaces ============================ */
// Main visible plate + an offscreen buffer used by the pixel-grid instruments.
export const cv = $('#cv');
export const ctx = cv.getContext('2d', { alpha: false });
export const buf = document.createElement('canvas');
export const bctx = buf.getContext('2d', { alpha: false, willReadFrequently: true });
