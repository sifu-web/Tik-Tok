# TikTok HQ Encoder

A static, browser-based video encoder for TikTok-oriented 9:16 MP4 exports.

## Highlights

- Runs video processing locally in the browser with ffmpeg.wasm.
- 1080×1920 output target.
- H.264 High Profile, yuv420p, AAC 256k/48 kHz.
- Smart FPS mode that attempts to preserve source frame rate, with optional 30/60 FPS output.
- Crop, contain, or blurred-background framing.
- CRF 14/16/18 quality presets with 20/30/40 Mbps bitrate ceilings.
- Preview, download and supported-device sharing.
- No application backend or database.

## Deploy on GitHub Pages

This repository includes a GitHub Actions workflow under `.github/workflows/pages.yml`.

1. Create a GitHub repository and upload the project files to the default branch.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Push to the default branch. The workflow deploys the static site.
5. Open the Pages URL shown by GitHub.

You do not need Vercel, Render, a database, or a custom backend for this project.

## Privacy model

The application does not contain an upload API. During normal use, selected video bytes are written into the browser's in-memory ffmpeg.wasm filesystem and encoded on the device. The page still loads the FFmpeg JavaScript/WASM engine from public CDNs.

## Important limitations

Re-encoding or upscaling cannot recreate source detail that is not present. The tool also cannot disable TikTok's own server-side processing after upload.

## Dependency notes

The browser app uses `@ffmpeg/ffmpeg` 0.12.15, `@ffmpeg/util` 0.12.2, and the single-thread `@ffmpeg/core` 0.12.10 through public CDN URLs.
