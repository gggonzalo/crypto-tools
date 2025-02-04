/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly CRYPTO_TOOLS_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
