import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    lib: {
      entry: {
        core: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      },
      name: 'lingr-core',
    },
    sourceMap: true,
    minify: false,
  },

  plugins: [dts({})],
});
