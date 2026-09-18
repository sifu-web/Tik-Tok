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

## Android file-provider fix

The previous build could fail during `selectedFile.arrayBuffer()` on Edge/Android with:

`NotReadableError: The requested file could not be read...`

Chromium uses this DOMException for a file/Blob that becomes unreadable after the reference was acquired. This build reads the selected file immediately after the picker returns and keeps the byte snapshot for encoding, so the encode stage never rereads the original Android file-provider reference.

If the picker itself cannot expose the bytes, select a copy stored in Downloads/device storage rather than a temporary/cloud-only reference.


## Android file-read fix (v4)
The encoder snapshots the selected video's bytes immediately inside the file-picker change event and then uses that in-memory copy for encoding. The encode step no longer calls `arrayBuffer()` on the original Android file-provider reference. This targets Chromium `NotReadableError` / `ERR_UPLOAD_FILE_CHANGED` behavior.

If the immediate snapshot itself fails, the page asks the user to select a locally stored copy from Downloads/device storage. Cloud/gallery provider references can remain unreadable to a browser even when the picker can display them.


## v5 file snapshot fix
The selected file is read immediately into a `Uint8Array`. The FFmpeg encode path uses only that byte snapshot and never calls `arrayBuffer()` on the original Android picker `File` object again. Metadata/preview use an in-memory Blob.

If the initial snapshot itself fails, the page reports `FILE SNAPSHOT ERROR` before encoding.
