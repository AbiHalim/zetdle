/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Optional: without it, accounts are simply off. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon key. Public by design - RLS is what protects the data. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
