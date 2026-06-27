import { strokes } from './strokes.js';
import { ascii } from './ascii.js';
import { automata } from './automata.js';
import { dither } from './dither.js';
import { particles } from './particles.js';

/* Instrument registry. Each: { label, params:[...], init(s), draw(s,t) }
   (automata also has step(s)). Order here is the order of the tab strip. */
export const INSTRUMENTS = {
  strokes,
  ascii,
  automata,
  dither,
  particles,
};
