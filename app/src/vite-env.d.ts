/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PHANTOM_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
