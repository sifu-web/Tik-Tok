export class FFmpeg {
  #worker = null;
  #nextId = 1;
  #resolves = new Map();
  #rejects = new Map();
  #logCallbacks = [];
  #progressCallbacks = [];
  loaded = false;

  on(event, callback) {
    if (event === "log") this.#logCallbacks.push(callback);
    else if (event === "progress") this.#progressCallbacks.push(callback);
  }

  off(event, callback) {
    if (event === "log") this.#logCallbacks = this.#logCallbacks.filter(x => x !== callback);
    else if (event === "progress") this.#progressCallbacks = this.#progressCallbacks.filter(x => x !== callback);
  }

  #startWorker() {
    if (this.#worker) return;
    const url = new URL("./ffmpeg-worker.js", import.meta.url);
    this.#worker = new Worker(url, { type: "classic" });

    this.#worker.onmessage = ({data}) => {
      const {id, type, data: payload} = data || {};
      if (type === "LOG") {
        for (const cb of this.#logCallbacks) {
          try { cb(payload); } catch {}
        }
        return;
      }
      if (type === "PROGRESS") {
        for (const cb of this.#progressCallbacks) {
          try { cb(payload); } catch {}
        }
        return;
      }

      const resolve = this.#resolves.get(id);
      const reject = this.#rejects.get(id);
      if (!resolve && !reject) return;

      this.#resolves.delete(id);
      this.#rejects.delete(id);

      if (type === "ERROR") reject(payload);
      else resolve(payload);
    };

    this.#worker.onerror = (event) => {
      const message = event?.message || "FFmpeg worker crashed.";
      for (const reject of this.#rejects.values()) {
        try { reject(new Error(message)); } catch {}
      }
      this.#resolves.clear();
      this.#rejects.clear();
    };
  }

  #send(type, data, transfer = [], signal) {
    if (!this.#worker) return Promise.reject(new Error("FFmpeg worker is not running."));
    return new Promise((resolve, reject) => {
      const id = this.#nextId++;
      this.#resolves.set(id, resolve);
      this.#rejects.set(id, reject);
      if (signal) {
        if (signal.aborted) {
          this.#resolves.delete(id);
          this.#rejects.delete(id);
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        signal.addEventListener("abort", () => {
          if (this.#resolves.has(id)) {
            this.#resolves.delete(id);
            this.#rejects.delete(id);
            reject(new DOMException("Aborted", "AbortError"));
          }
        }, {once:true});
      }
      try {
        this.#worker.postMessage({id, type, data}, transfer);
      } catch (e) {
        this.#resolves.delete(id);
        this.#rejects.delete(id);
        reject(e);
      }
    });
  }

  async load({coreURL, wasmURL, workerURL} = {}, {signal} = {}) {
    this.#startWorker();
    const first = !this.loaded;
    await this.#send("LOAD", {coreURL, wasmURL, workerURL}, [], signal);
    this.loaded = true;
    return first;
  }

  exec(args, timeout = -1, {signal} = {}) {
    return this.#send("EXEC", {args, timeout}, [], signal);
  }

  ffprobe(args, timeout = -1, {signal} = {}) {
    return this.#send("FFPROBE", {args, timeout}, [], signal);
  }

  writeFile(path, data, {signal} = {}) {
    let payload = data;
    const transfer = [];
    if (data instanceof ArrayBuffer) {
      payload = new Uint8Array(data);
      transfer.push(payload.buffer);
    } else if (data instanceof Uint8Array) {
      transfer.push(data.buffer);
    }
    return this.#send("WRITE_FILE", {path, data: payload}, transfer, signal);
  }

  readFile(path, encoding = "binary", {signal} = {}) {
    return this.#send("READ_FILE", {path, encoding}, [], signal);
  }

  deleteFile(path, {signal} = {}) {
    return this.#send("DELETE_FILE", {path}, [], signal);
  }

  terminate() {
    const err = new Error("FFmpeg worker terminated.");
    for (const reject of this.#rejects.values()) {
      try { reject(err); } catch {}
    }
    this.#resolves.clear();
    this.#rejects.clear();
    if (this.#worker) this.#worker.terminate();
    this.#worker = null;
    this.loaded = false;
  }
}
