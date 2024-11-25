import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Icons from "unplugin-icons/vite";
import IconResolver from "unplugin-icons/resolver";
import Components from "unplugin-vue-components/vite";
import { createHtmlPlugin } from "vite-plugin-html";
import createExternal from "vite-plugin-external";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
// import { visualizer } from 'rollup-plugin-visualizer'
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: env.DEV ? "./" : "/map/",

    build: {
      target: "esnext",
    },

    plugins: [
      vue({
        template: { transformAssetUrls },
      }),
      vuetify({
        autoImport: true,
        styles: "expose",
      }),
      Components({
        resolvers: [IconResolver({ componentPrefix: "i" })],
        dts: "types/components.d.ts",
      }),
      AutoImport({
        imports: ["vue", "vue-router", "@vueuse/core", "pinia"],
        dts: "types/auto-import.d.ts",
      }),
      Icons({
        compiler: "vue3",
      }),
      createHtmlPlugin({
        template: "./index.html",
        inject: {
          tags: [
            {
              injectTo: "head",
              tag: "link",
              attrs: {
                rel: "stylesheet",
                href: "https://unpkg.com/mapbox-gl@3.8.0/dist/mapbox-gl.css",
              },
            },
            {
              injectTo: "head",
              tag: "script",
              attrs: {
                src: "https://unpkg.com/vue@3.5.13/dist/vue.global.prod.js",
              },
            },
            {
              injectTo: "head",
              tag: "script",
              attrs: {
                src: "https://unpkg.com/vue-router@4.4.3/dist/vue-router.global.js",
              },
            },
            {
              injectTo: "head",
              tag: "script",
              attrs: {
                src: "https://unpkg.com/mapbox-gl@3.8.0/dist/mapbox-gl.js",
              },
            },
          ],
        },
      }),
      mode === "production" &&
        createExternal({
          interop: "auto",
          externals: {
            vue: "Vue",
            "vue-router": "VueRouter",
            "mapbox-gl": "mapboxgl",
          },
        }),
      // visualizer({
      //   open: true,
      //   gzipSize: true,
      //   brotliSize: true,
      // }),
    ].filter(Boolean),

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
  };
});
