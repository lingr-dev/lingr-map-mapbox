/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string;
  // 更多环境变量...

  readonly VITE_TDT_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
