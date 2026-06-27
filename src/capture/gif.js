/* ============================ streaming animated GIF89a ============================
   Dependency-free. Our frames are grayscale (R=G=B), so the global colour table
   is a 256-entry grayscale ramp and each pixel's index IS its grey value — exact,
   no quantization. Real LZW compression (long B&W runs pack down well). Frames are
   encoded one at a time and appended, so we never hold the whole clip in memory. */

function lzwEncode(indexStream, minCodeSize){
  const out = [];
  let cur = 0, curBits = 0;
  const put = (code, size) => {
    cur |= code << curBits; curBits += size;
    while(curBits >= 8){ out.push(cur & 255); cur >>= 8; curBits -= 8; }
  };

  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  let table = new Map();

  put(clearCode, codeSize);
  let prefix = indexStream[0];
  for(let i = 1; i < indexStream.length; i++){
    const k = indexStream[i];
    const key = prefix * 256 + k;
    const existing = table.get(key);
    if(existing !== undefined){
      prefix = existing;
    } else {
      put(prefix, codeSize); // emit at the current size FIRST
      if(nextCode === 4096){
        // table full — reset (decoder does the same on the clear code)
        put(clearCode, codeSize);
        table = new Map();
        nextCode = eoiCode + 1;
        codeSize = minCodeSize + 1;
      } else {
        // bump the code size just before assigning a code that needs it
        if(nextCode >= (1 << codeSize) && codeSize < 12) codeSize++;
        table.set(key, nextCode++);
      }
      prefix = k;
    }
  }
  put(prefix, codeSize);
  put(eoiCode, codeSize);
  if(curBits > 0) out.push(cur & 255);
  return out;
}

const str = s => { const a = new Uint8Array(s.length); for(let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
const u16 = v => new Uint8Array([v & 255, (v >> 8) & 255]);

export class GifEncoder {
  constructor({ width, height, fps, loop = 0 }){
    this.width = width; this.height = height;
    this.delay = Math.max(2, Math.round(100 / fps)); // centiseconds
    this.parts = [];

    // header + logical screen descriptor + grayscale global colour table
    this.parts.push(str('GIF89a'), u16(width), u16(height), new Uint8Array([0xF7, 0, 0]));
    const gct = new Uint8Array(256 * 3);
    for(let i = 0; i < 256; i++){ gct[i * 3] = gct[i * 3 + 1] = gct[i * 3 + 2] = i; }
    this.parts.push(gct);
    // NETSCAPE2.0 loop extension
    this.parts.push(new Uint8Array([0x21, 0xFF, 0x0B]), str('NETSCAPE2.0'),
      new Uint8Array([0x03, 0x01]), u16(loop), new Uint8Array([0x00]));
  }

  addFrame(imageData){
    const { width: w, height: h, delay } = this;
    // graphic control extension: disposal=1 (do not dispose), no transparency
    this.parts.push(new Uint8Array([0x21, 0xF9, 0x04, 0x04, delay & 255, (delay >> 8) & 255, 0x00, 0x00]));
    // image descriptor
    this.parts.push(new Uint8Array([0x2C]), u16(0), u16(0), u16(w), u16(h), new Uint8Array([0x00]));

    const d = imageData.data;
    const idx = new Uint8Array(w * h);
    for(let p = 0; p < idx.length; p++) idx[p] = d[p * 4]; // R channel = grey level

    this.parts.push(new Uint8Array([8])); // LZW min code size
    const lzw = lzwEncode(idx, 8);
    // pack into <=255-byte sub-blocks
    for(let o = 0; o < lzw.length; o += 255){
      const n = Math.min(255, lzw.length - o);
      const block = new Uint8Array(n + 1);
      block[0] = n;
      for(let j = 0; j < n; j++) block[j + 1] = lzw[o + j];
      this.parts.push(block);
    }
    this.parts.push(new Uint8Array([0x00])); // block terminator
  }

  finish(){
    this.parts.push(new Uint8Array([0x3B])); // trailer
    return new Blob(this.parts, { type: 'image/gif' });
  }
}
