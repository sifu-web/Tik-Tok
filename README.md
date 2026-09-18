# TikTok HQ Encoder

Static GitHub Pages browser encoder using FFmpeg.wasm.

The FFmpeg UMD loader and its split worker are fetched with CORS, then the worker is converted to a same-origin Blob URL before `Worker()` is created. This avoids the cross-origin worker error that occurs when `@ffmpeg/ffmpeg` is imported directly from a CDN.

FFmpeg core JS/WASM is also converted to Blob URLs before loading.

No backend is required.
