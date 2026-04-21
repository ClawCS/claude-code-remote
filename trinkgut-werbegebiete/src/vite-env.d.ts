/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_STORE_LAT?: string;
  readonly VITE_STORE_LNG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
