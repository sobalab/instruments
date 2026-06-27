import { strokes } from './strokes.js';
import { ascii } from './ascii.js';
import { automata } from './automata.js';
import { dither } from './dither.js';
import { particles } from './particles.js';
import { wolfram } from './wolfram.js';
import { bits } from './bits.js';

/* Instrument registry. Each: { label, params:[...], init(s), draw(s,t) }
   (stepped CA instruments also have step(s)). Order here is the tab strip. */
export const INSTRUMENTS = {
  strokes,
  ascii,
  automata,
  dither,
  particles,
  wolfram,
  bits,
};
