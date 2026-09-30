/**
 * KOPIIN – Supabase Client Foundation
 * Sesuai Master Prompt 1:
 * - Supabase digunakan HANYA sebagai infrastruktur database, storage, dan realtime.
 * - JANGAN gunakan Supabase Auth (KOPIIN memiliki sistem akun dan autentikasi sendiri).
 * - Integrasi client HANYA menggunakan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.
 * - JANGAN meminta atau mengekspos SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfigStatus } from '../../types/platform';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      // Supabase Auth dinonaktifkan: KOPIIN menggunakan sistem akun sendiri
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseClient;
}

export function getSupabaseStatus(): SupabaseConfigStatus {
  const isConfigured = Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon-key')
  );

  return {
    isConfigured,
    url: isConfigured ? supabaseUrl : null,
    hasAnonKey: Boolean(supabaseAnonKey && !supabaseAnonKey.includes('your-anon-key')),
    mode: isConfigured ? 'live_supabase' : 'cloud_ready_sandbox',
    authEngine: 'KOPIIN_NATIVE_AUTH',
    database: 'Supabase PostgreSQL',
    storage: 'Supabase Storage',
    realtime: 'Supabase Realtime',
  };
}
