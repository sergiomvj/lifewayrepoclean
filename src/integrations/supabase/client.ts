import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

// Singleton pattern para evitar múltiplas instâncias do GoTrueClient
let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Configurações para evitar múltiplas instâncias
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Usar um storage key único para evitar conflitos
        storageKey: 'lifeway-supabase-auth-token'
      },
      // Configurações de performance
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()