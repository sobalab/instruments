/* ============================ global state ============================ */
export const ASPECTS = {
  '1:1':  [1080, 1080],
  '4:5':  [1080, 1350],
  '16:9': [1920, 1080],
  '9:16': [1080, 1920],
};

export const state = {
  instrument: 'strokes',
  aspect: '1:1',
  invert: false,
  speed: 1,
  seed: (Math.random() * 1e6) | 0,
  playing: true,
  clock: 0,
  frame: 0,
  W: 1080, H: 1080,
  noise: null,
  inst: null,        // per-instrument working state
  params: {},        // live param values for the active instrument
  bridge: null,      // the object handed to instrument init/draw/step
  loop: { on: false, dur: 6 },  // seamless-loop mode + duration (seconds)
};

// monochrome palette — inverted swaps fg/bg. Canvas stays strictly 1-bit by default.
export function colors(){
  return state.invert
    ? { bg: '#fff', fg: '#000', bgN: 255, fgN: 0 }
    : { bg: '#000', fg: '#fff', bgN: 0,   fgN: 255 };
}
