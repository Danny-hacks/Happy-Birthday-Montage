import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { resolve } from 'path'

// Auto-sync media before build and on file changes during dev
function mediaSyncPlugin() {
  const syncScript = resolve(__dirname, '..', 'sync-media.js');
  const runSync = () => {
    try {
      execSync(`node "${syncScript}" --no-watch`, { stdio: 'inherit' });
    } catch {}
  };

  return {
    name: 'media-sync',
    buildStart() { runSync(); },
    configureServer(server) {
      // Watch the root media folder and re-sync on changes
      const mediaDir = resolve(__dirname, '..', 'media');
      const chokidar = server.watcher;
      chokidar.add(mediaDir);

      let debounce = null;
      chokidar.on('all', (event, filePath) => {
        if (!filePath.startsWith(mediaDir)) return;
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          console.log('\n📸 Media changed — syncing...');
          runSync();
        }, 800);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mediaSyncPlugin()],
})
