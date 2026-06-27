/* ============================ looping noise ============================
   Makes a time-driven noise sample loop seamlessly over a period.

   Time enters an instrument as a moving offset of the noise sample
   coordinate: arg(t) = base + v·t, where v is the per-loop-second velocity
   of that offset. Over one loop the offset travels v·P (P = loop seconds).
   We cross-blend the field at the current offset with the field one full
   loop-displacement back, weighted by the loop phase:

     L(φ) = (1-φ)·N(x, y) + φ·N(x - v·P, y - v·P)

   With the instrument fed loop-local time τ = φ·P, L(0) == L(1) and the
   content depends only on φ — a true seamless loop. The blend is of noise
   *values*, so the instrument's own per-pixel quantization keeps output
   strictly 1-bit (no grey crossfade).

   When loop is off (or the instrument isn't loop-aware) it's a pass-through,
   so non-loop rendering is byte-identical to before. */
export function loopN(s, fn, x, y, vx, vy){
  const lp = s.loop;
  if(!lp || !lp.on) return fn(x, y);
  const ph = lp.phase, P = lp.P;
  return (1 - ph) * fn(x, y) + ph * fn(x - vx * P, y - vy * P);
}
