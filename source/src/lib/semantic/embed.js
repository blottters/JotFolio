// MiniLM sentence embeddings via @xenova/transformers (transformers.js).
//
// Charter compliance: NO remote model loading. The model files are bundled
// in `public/models/Xenova/all-MiniLM-L6-v2/`. We point transformers.js at the
// local copy and explicitly disable remote loading so a missing file fails
// loudly instead of silently fetching from huggingface.co.
//
// Output: 384-dim Float32Array, L2-normalized sentence embedding. Mean-pooling
// over token embeddings (the standard for sentence-transformers MiniLM).

let pipelinePromise = null;

async function configureEnv() {
  const { env } = await import('@xenova/transformers');
  // Local-only mode. Both flags belt-and-suspenders the no-network promise.
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  // Where transformers.js looks for `<modelName>/...` on disk. Vite serves
  // `public/` at the site root, so models live under `./models/` in both
  // dev (http://localhost:5174/models/...) and packaged Electron (file://...).
  // The trailing slash matters — transformers.js concats `<localModelPath>/<modelName>/...`.
  if (typeof window !== 'undefined') {
    // Resolve against document.baseURI so the path works under both file://
    // (packaged) and http:// (vite dev).
    try {
      const base = new URL('./models/', document.baseURI).href;
      env.localModelPath = base;
    } catch {
      env.localModelPath = 'models/';
    }
  } else {
    env.localModelPath = 'models/';
  }
  // Backend hint: WASM is the only browser/Electron-safe backend for ONNX.
  if (env.backends?.onnx?.wasm) {
    // Default to single-threaded WASM. Multi-thread needs cross-origin headers
    // which Electron file:// can't easily provide.
    env.backends.onnx.wasm.numThreads = 1;
    // Point ONNX runtime at our locally-bundled WASM files. Without this,
    // it tries to fetch them from a CDN (charter violation) or from a
    // wrong relative path under file://.
    try {
      const wasmBase = typeof window !== 'undefined'
        ? new URL('./onnx-wasm/', document.baseURI).href
        : 'onnx-wasm/';
      env.backends.onnx.wasm.wasmPaths = wasmBase;
    } catch {
      env.backends.onnx.wasm.wasmPaths = 'onnx-wasm/';
    }
  }
}

// Lazy + idempotent: returns the same Promise on every call so concurrent
// callers share a single model load.
export async function loadModel() {
  if (pipelinePromise) return pipelinePromise;
  pipelinePromise = (async () => {
    await configureEnv();
    const { pipeline } = await import('@xenova/transformers');
    // quantized: true → loads onnx/model_quantized.onnx (the ~23MB int8 build)
    // instead of the ~90MB fp32 model. Quality loss is negligible for
    // sentence embeddings.
    return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });
  })();
  // If the load fails, clear the cached promise so a retry can succeed (e.g.
  // user reload after fixing a file system issue).
  pipelinePromise.catch(() => { pipelinePromise = null; });
  return pipelinePromise;
}

// Returns a fresh Float32Array of length 384, L2-normalized so that
// cosine similarity = dot product.
export async function embedText(text) {
  const input = String(text == null ? '' : text);
  if (!input.trim()) return null;
  const extractor = await loadModel();
  // pooling: 'mean' → mean-pool over token embeddings (standard for MiniLM).
  // normalize: true → L2-normalize the resulting vector.
  const output = await extractor(input, { pooling: 'mean', normalize: true });
  // output.data is a Float32Array of length 384. Copy so callers can mutate
  // without affecting transformers.js's internal tensor.
  return new Float32Array(output.data);
}

// Test seam — lets vi.mock reset the cached pipeline between tests.
export function _resetModelForTests() {
  pipelinePromise = null;
}
