// Mock plugin discovery — simulates scanning N plugin manifests without
// actually executing main.js. Isolates the discovery path from execution
// cost (which is tested separately per-plugin in Phase 4's unit tests).

function mockManifest(i) {
  return JSON.stringify({
    id: `plugin-${i}`,
    name: `Plugin ${i}`,
    version: '0.1.0',
    author: 'bench',
    main: 'main.js',
    jotfolio_min_version: '0.4.0',
    permissions: {
      vault_read: i % 2 === 0,
      vault_write: i % 3 === 0,
      http_domains: i % 5 === 0 ? ['api.example.com'] : [],
    },
  });
}

function make(n) {
  return {
    id: `plugin-discover-${n}`,
    warmup: 2,
    iterations: 10,
    setup: () => {
      const files = [];
      for (let i = 0; i < n; i++) {
        files.push({
          path: `.jotfolio/plugins/plugin-${i}/manifest.json`,
          name: 'manifest.json',
          folder: `.jotfolio/plugins/plugin-${i}`,
          content: mockManifest(i),
        });
      }
      return { files };
    },
    fn: ({ files }) => {
      // Mirror PluginHost.discover()'s core loop: parse each manifest,
      // validate required fields. No actual vault I/O.
      const plugins = new Map();
      for (const f of files) {
        try {
          const manifest = JSON.parse(f.content);
          if (!manifest.id || !manifest.name || !manifest.main) continue;
          plugins.set(manifest.id, { manifest, folder: f.folder, status: 'disabled' });
        } catch { /* skip */ }
      }
      return plugins.size;
    },
  };
}

export default [make(5), make(20), make(50)];
