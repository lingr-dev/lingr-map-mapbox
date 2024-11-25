/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string;
  // 更多环境变量...

  readonly VITE_TDT_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
