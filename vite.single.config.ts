import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json' with { type: 'json' };
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build do jednoho HTML souboru – lze otevřít dvojklikem bez serveru
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { outDir: 'dist-single', chunkSizeWarningLimit: 5000 },
});
