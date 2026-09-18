let ffmpeg = null;

const MSG = {
  LOAD: "LOAD",
  EXEC: "EXEC",
  FFPROBE: "FFPROBE",
  WRITE_FILE: "WRITE_FILE",
  READ_FILE: "READ_FILE",
  DELETE_FILE: "DELETE_FILE",
  LOG: "LOG",
  PROGRESS: "PROGRESS",
  ERROR: "ERROR"
};

function post(id, type, data, transfer = []) {
  self.postMessage({id, type, data}, transfer);
}

async function loadCore({coreURL, wasmURL, workerURL}) {
  const resolvedCore = coreURL;
  if (!resolvedCore) throw new Error("Missing FFmpeg coreURL.");

  // Classic worker: the FFmpeg core UMD build is intentionally loaded here.
  importScripts(resolvedCore);

  const factory = self.createFFmpegCore;
  if (typeof factory !== "function") {
    throw new Error("FFmpeg core did not expose createFFmpegCore.");
  }

  const wasm = wasmURL || resolvedCore.replace(/\.js$/i, ".wasm");
  const coreWorker = workerURL || resolvedCore.replace(/\.js$/i, ".worker.js");

  ffmpeg = await factory({
    mainScriptUrlOrBlob:
      `${resolvedCore}#${btoa(JSON.stringify({wasmURL: wasm, workerURL: coreWorker}))}`
  });

  if (typeof ffmpeg.setLogger === "function") {
    ffmpeg.setLogger(data => self.postMessage({type: MSG.LOG, data}));
  }
  if (typeof ffmpeg.setProgress === "function") {
    ffmpeg.setProgress(data => self.postMessage({type: MSG.PROGRESS, data}));
  }
}

function doExec({args, timeout = -1}) {
  ffmpeg.setTimeout(timeout);
  ffmpeg.exec(...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
}

function doProbe({args, timeout = -1}) {
  ffmpeg.setTimeout(timeout);
  ffmpeg.ffprobe(...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
}

self.onmessage = async ({data}) => {
  const {id, type, data: payload} = data || {};
  try {
    if (type === MSG.LOAD) {
      await loadCore(payload || {});
      post(id, MSG.LOAD, true);
      return;
    }
    if (!ffmpeg) throw new Error("FFmpeg is not loaded.");

    if (type === MSG.EXEC) {
      post(id, MSG.EXEC, doExec(payload));
      return;
    }
    if (type === MSG.FFPROBE) {
      post(id, MSG.FFPROBE, doProbe(payload));
      return;
    }
    if (type === MSG.WRITE_FILE) {
      ffmpeg.FS.writeFile(payload.path, payload.data);
      post(id, MSG.WRITE_FILE, true);
      return;
    }
    if (type === MSG.READ_FILE) {
      const out = ffmpeg.FS.readFile(payload.path, {encoding: payload.encoding || "binary"});
      const transfer = out instanceof Uint8Array ? [out.buffer] : [];
      post(id, MSG.READ_FILE, out, transfer);
      return;
    }
    if (type === MSG.DELETE_FILE) {
      ffmpeg.FS.unlink(payload.path);
      post(id, MSG.DELETE_FILE, true);
      return;
    }
    throw new Error(`Unknown FFmpeg message type: ${type}`);
  } catch (e) {
    post(id, MSG.ERROR, String(e?.stack || e?.message || e));
  }
};
