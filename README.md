# TikTok HQ Encoder — final package

This version removes the fragile UMD string-patching approach that caused:

`FFmpeg UMD worker pattern changed; refusing unsafe fallback.`

## Worker architecture

The page uses a tiny local FFmpeg client and a local same-origin classic worker:

- `assets/ffmpeg/ffmpeg-client.js`
- `assets/ffmpeg/ffmpeg-worker.js`

The worker loads the pinned FFmpeg core JS as a blob and receives the pinned WASM blob URL. This follows the FFmpeg.wasm worker/core design: the worker is separate from the core, and `coreURL`, `wasmURL`, and optional `workerURL` are passed into the load step.

## GitHub Pages

Keep `index.html` at the repository root.

The included workflow deploys the entire repository with GitHub Pages Actions.

After pushing, test:

`https://sifu-web.github.io/Tik-Tok/?v=final2`

## Edge Android

Start with a 10–20 second clip. WebAssembly video encoding can consume significant memory on phones.

The encoder outputs a 1080×1920 H.264 High MP4, yuv420p, CRF 16, high bitrate ceiling, AAC 320 kbps/48 kHz and faststart. Source FPS is preserved up to 60 rather than inventing extra frames.

This cannot bypass TikTok's server-side processing or reconstruct detail absent from the source.
