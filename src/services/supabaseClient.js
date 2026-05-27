import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const PLACEHOLDER_URL = 'https://your-project-ref.supabase.co';
const PLACEHOLDER_KEY = 'pkey_your_public_anon_key';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY are required in admin-dashboard/.env'
  );
}

export function getSupabaseConfigError() {
  if (SUPABASE_URL === PLACEHOLDER_URL || SUPABASE_KEY === PLACEHOLDER_KEY) {
    return new Error(
      'Supabase is not configured for the admin app. Replace VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY in admin-dashboard/.env with your real Supabase project values.'
    );
  }

  try {
    const hostname = new URL(SUPABASE_URL).hostname;
    if (!hostname.endsWith('.supabase.co')) {
      return new Error(
        'VITE_SUPABASE_URL must be a valid Supabase project URL like https://your-project-ref.supabase.co.'
      );
    }
  } catch {
    return new Error(
      'VITE_SUPABASE_URL must be a valid URL like https://your-project-ref.supabase.co.'
    );
  }

  return null;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

