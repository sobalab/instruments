import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { state } from '../core/state.js';
import { exportFrames } from './render.js';

/* ============================ MP4 export (WebCodecs + mp4-muxer) ============================
   WebCodecs encodes frames to H.264; mp4-muxer wraps the chunks in an MP4 container.
   H.264 level is probed so the chosen profile actually supports the export resolution. */

export function hasWebCodecs(){
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
}

// High-profile codec strings from highest level down — first one the platform
// supports for these dimensions/fps wins.
const AVC_CANDIDATES = [
  'avc1.640034', 'avc1.640033', 'avc1.640032', // High 5.2 / 5.1 / 5.0 (4K)
  'avc1.64002a', 'avc1.640028',                 // High 4.2 / 4.0 (1080p)
  'avc1.4d0028', 'avc1.42e028',                 // Main / Baseline 4.0
  'avc1.42001f',                                // Baseline 3.1 (720p)
];

async function pickCodec(width, height, framerate, bitrate){
  if(!VideoEncoder.isConfigSupported) return AVC_CANDIDATES[4];
  for(const codec of AVC_CANDIDATES){
    try{
      const res = await VideoEncoder.isConfigSupported({ codec, width, height, framerate, bitrate });
      if(res && res.supported) return codec;
    }catch{ /* keep trying */ }
  }
  return null;
}

export async function exportMp4({ fps, dur, scale = 1, seamless = false, onProgress }){
  if(!hasWebCodecs()) throw new Error('no-webcodecs');

  // H.264 requires even dimensions
  const width = (state.W * scale) & ~1;
  const height = (state.H * scale) & ~1;
  const bitrate = 12_000_000 * scale;

  const codec = await pickCodec(width, height, fps, bitrate);
  if(!codec) throw new Error('no-avc');

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width, height, frameRate: fps },
    fastStart: 'in-memory',
  });

  let encodeError = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: e => { encodeError = e; },
  });
  encoder.configure({ codec, width, height, bitrate, framerate: fps, latencyMode: 'quality' });

  const frameDur = Math.round(1e6 / fps);
  await exportFrames({
    fps, dur, scale, seamless,
    onFrame: async (out, k) => {
      if(encodeError) throw encodeError;
      const frame = new VideoFrame(out, { timestamp: k * frameDur, duration: frameDur });
      encoder.encode(frame, { keyFrame: k % fps === 0 }); // keyframe ~once per second
      frame.close();
      // respect encoder backpressure
      while(encoder.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 0));
    },
    onProgress,
  });

  await encoder.flush();
  if(encodeError) throw encodeError;
  muxer.finalize();
  encoder.close();
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}
