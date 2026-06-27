import { lerp } from './utils.js';
import { mulberry32 } from './rng.js';

/* ============================ seeded noise ============================ */
// seeded value/perlin-style 2D noise + fbm — every visual reproducible from a seed.
export function makeNoise(seed){
  const rand = mulberry32(seed >>> 0);
  const p = new Uint8Array(256);
  for(let i = 0; i < 256; i++) p[i] = i;
  for(let i = 255; i > 0; i--){ const j = (rand() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
  const perm = new Uint8Array(512);
  for(let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  function grad(h, x, y){ switch(h & 3){ case 0: return x + y; case 1: return -x + y; case 2: return x - y; default: return -x - y; } }
  function noise2(x, y){
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v) * 0.5 + 0.5;
  }
  function fbm(x, y, oct){
    oct = oct || 4;
    let a = 0.5, f = 1, s = 0, n = 0;
    for(let i = 0; i < oct; i++){ s += a * noise2(x * f, y * f); n += a; a *= 0.5; f *= 2; }
    return s / n;
  }
  return { noise2, fbm };
}
