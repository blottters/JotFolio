import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so the production bundle's asset URLs resolve under
  // both http:// (dev server) and file:// (packaged Electron). Without
  // this, vite emits absolute /assets/... paths that resolve to the
  // disk root when the renderer loads dist/index.html via loadFile —
  // result is a blank window with menu but no React tree mounted.
  base: './',
  plugins: [react()],
  server: { port: 5174 }
})
