import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!rawUrl || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in.',
  )
}

// createClient expects the project origin only. A copied REST URL like
// https://xxx.supabase.co/rest/v1 turns signup into /rest/v1/auth/v1/signup,
// which Kong rejects with "Invalid path specified in request URL".
function projectUrl(value: string): string {
  return value.trim().replace(/\/+$/, '').replace(/\/(rest|auth)\/v1$/i, '')
}

const url = projectUrl(rawUrl)

// The anon/publishable key is designed to be public. What protects your data
// is Row Level Security in the database, not hiding this key.
// NEVER put the service_role key in this app.
export const supabase = createClient(url, key)
