import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the heavy transformer pipeline so we don't load real ONNX in tests.
vi.mock('@xenova/transformers', () => {
  const fakeExtractor = vi.fn(async (text /* , opts */) => ({
    data: new Float32Array(384).fill(0.5),
  }));
  return {
    env: { allowRemoteModels: true, allowLocalModels: false, localModelPath: '', backends: { onnx: { wasm: { numThreads: 4, wasmPaths: '' } } } },
    pipeline: vi.fn(async () => fakeExtractor),
    __fakeExtractor: fakeExtractor,
  };
});

import { embedText, loadModel, _resetModelForTests } from './embed.js';

describe('semantic/embed', () => {
  beforeEach(() => {
    _resetModelForTests();
  });

  it('embedText returns null for empty input', async () => {
    expect(await embedText('')).toBeNull();
    expect(await embedText(null)).toBeNull();
  });

  it('embedText returns a 384-dim Float32Array for text', async () => {
    const vec = await embedText('hello world');
    expect(vec).toBeInstanceOf(Float32Array);
    expect(vec.length).toBe(384);
  });

  it('loadModel concurrent calls resolve to the same extractor instance', async () => {
    const [a, b] = await Promise.all([loadModel(), loadModel()]);
    expect(a).toBe(b);
  });
});
