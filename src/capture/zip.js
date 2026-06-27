/* ============================ minimal ZIP (store) ============================
   Dependency-free ZIP writer using the "stored" method (no compression).
   PNG frames are already compressed, so storing them is the right call and
   keeps us free of a deflate dependency. */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for(let n = 0; n < 256; n++){
    let c = n;
    for(let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes){
  let c = 0xFFFFFFFF;
  for(let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

const enc = new TextEncoder();

// files: [{ name: string, data: Uint8Array }]
export function makeZip(files){
  const chunks = [];          // body: local headers + data
  const central = [];         // central directory records
  let offset = 0;

  for(const f of files){
    const nameBytes = enc.encode(f.name);
    const data = f.data;
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);   // local file header sig
    local.setUint16(4, 20, true);           // version needed
    local.setUint16(6, 0, true);            // flags
    local.setUint16(8, 0, true);            // method 0 = store
    local.setUint16(10, 0, true);           // mod time
    local.setUint16(12, 0, true);           // mod date
    local.setUint32(14, crc, true);         // crc32
    local.setUint32(18, data.length, true); // compressed size
    local.setUint32(22, data.length, true); // uncompressed size
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);           // extra len
    chunks.push(new Uint8Array(local.buffer), nameBytes, data);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);     // central dir sig
    cen.setUint16(4, 20, true);             // version made by
    cen.setUint16(6, 20, true);             // version needed
    cen.setUint16(8, 0, true);
    cen.setUint16(10, 0, true);             // method
    cen.setUint16(12, 0, true);
    cen.setUint16(14, 0, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, nameBytes.length, true);
    cen.setUint16(30, 0, true);             // extra len
    cen.setUint16(32, 0, true);             // comment len
    cen.setUint16(34, 0, true);             // disk #
    cen.setUint16(36, 0, true);             // internal attrs
    cen.setUint32(38, 0, true);             // external attrs
    cen.setUint32(42, offset, true);        // local header offset
    central.push(new Uint8Array(cen.buffer), nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }

  const centralStart = offset;
  let centralSize = 0;
  for(const c of central) centralSize += c.length;

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);      // EOCD sig
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, files.length, true);
  eocd.setUint16(10, files.length, true);
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, centralStart, true);
  eocd.setUint16(20, 0, true);

  return new Blob([...chunks, ...central, new Uint8Array(eocd.buffer)], { type: 'application/zip' });
}
