import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { resolve } from 'path'

// Auto-sync media before build
function mediaSyncPlugin() {
  const syncScript = resolve(__dirname, '..', 'sync-media.js');

  return {
    name: 'media-sync',
    buildStart() {
      try {
        execSync(`node "${syncScript}" --no-watch`, { stdio: 'inherit' });
      } catch {}
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mediaSyncPlugin()],
})
