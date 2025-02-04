/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly CRYPTO_TOOLS_API_URL: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
