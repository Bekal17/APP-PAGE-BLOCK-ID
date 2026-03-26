/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENFORT_PUBLISHABLE_KEY?: string;
  readonly VITE_OPENFORT_SHIELD_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
