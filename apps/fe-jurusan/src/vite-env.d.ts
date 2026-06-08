/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTHENTIK_CLIENT_ID: string;
  readonly VITE_AUTHENTIK_CLIENT_SECRET: string;
  readonly VITE_AUTHENTIK_ISSUER_URL: string;
  readonly VITE_API_OBE_URL: string;
  readonly VITE_API_AKADEMIK_URL: string;
  // Tenant per-deployment — UUID of the study program this instance belongs to
  readonly VITE_STUDY_PROGRAM_ID: string;
  // Display name shown in sidebar & header (e.g. "Informatika")
  readonly VITE_STUDY_PROGRAM_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
