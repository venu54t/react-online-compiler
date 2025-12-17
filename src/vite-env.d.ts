interface ImportMetaEnv {
  readonly VITE_WS_API: string;
  readonly VITE_WS_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}