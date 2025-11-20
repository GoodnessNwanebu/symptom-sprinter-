import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Only load env vars that start with VITE_ for client-side access
    // This prevents exposing API keys in the client bundle
    const env = loadEnv(mode, '.', 'VITE_');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // REMOVED: Don't define API keys in client bundle - they get exposed!
      // API keys should be handled server-side only
      define: {
        // Only expose non-sensitive config if needed
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
