/* ============================ utilities ============================ */
export const $ = s => document.querySelector(s);
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;

// grid topology helper shared by several instruments
export function defGrid(W, H, cell){
  const gw = Math.max(2, Math.round(W / cell));
  const gh = Math.max(2, Math.round(H / cell));
  return { gw, gh };
}
