import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * The Supabase client, or null when the site is built without credentials.
 *
 * Accounts are an optional extra, never a dependency. Local development with
 * an empty .env, and a deploy where someone forgot to set the variables, both
 * have to work exactly as the game always has. Null here means "signed out,
 * forever", and every caller treats that as an ordinary state, not an error.
 *
 * The anon key is public by design - it ships inside the JavaScript bundle.
 * Row-level security on daily_results is the only thing keeping one player out
 * of another's rows, so it must never be turned off, and a service_role key
 * must never go in a VITE_ variable.
 */

/** Vite leaves a missing variable undefined; a blank one stays an empty string. */
function readEnv(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function createIfConfigured(): SupabaseClient | null {
  const url = readEnv(import.meta.env.VITE_SUPABASE_URL)
  const anonKey = readEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)

  if (!url || !anonKey) return null

  if (!url.startsWith('https://')) {
    // A half-filled .env is a configuration mistake, not a runtime failure.
    console.warn('VITE_SUPABASE_URL does not look like a URL - accounts are off.')
    return null
  }

  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Consumes the ?code= Supabase appends when Google sends the player
        // back here, and tidies it out of the address bar.
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  } catch {
    return null
  }
}

/** One client for the whole app: two would fight over the auth lock. */
export const supabase = createIfConfigured()

/** Whether to show anything account-related at all. */
export const accountsEnabled = supabase !== null
