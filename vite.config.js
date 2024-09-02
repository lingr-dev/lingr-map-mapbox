import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Icons from "unplugin-icons/vite";
import IconResolver from "unplugin-icons/resolver";
import Components from "unplugin-vue-components/vite";
import { createHtmlPlugin } from "vite-plugin-html";
import externalGlobals from "rollup-plugin-external-globals";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",

  build: {
    target: "esnext",

    rollupOptions: {
      input: {
        home: path.resolve(__dirname, "index.html"),
      },
      external: ["vue", "mapbox-gl"],
      plugins: [
        externalGlobals({
          vue: "Vue",
          "mapbox-gl": "mapboxgl",
        }),
      ],
    },
  },

  plugins: [
    vue(),
    AutoImport({
      imports: ["vue", "vue-router", "@vueuse/core", "pinia"],
      dts: "types/auto-import.d.ts",
      dirs: ["src/stores", "src/hooks"],
    }),
    Components({
      resolvers: [IconResolver()],
    }),
    Icons({}),
    createHtmlPlugin({
      template: "./index.html",
      inject: {
        tags: [
          {
            injectTo: "head",
            tag: "script",
            attrs: {
              src: "https://unpkg.com/vue@3.4.37/dist/vue.global.prod.js",
            },
          },
          {
            injectTo: "head",
            tag: "script",
            attrs: {
              src: "https://unpkg.com/mapbox-gl@3.6.0/dist/mapbox-gl.js",
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/assets/style/mixin.scss";',
      },
    },
  },
});
