import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  
  // Kiểm tra nếu service key là key thật (không phải demo placeholder)
  const isGenuineServiceKey =
    serviceKey &&
    !serviceKey.includes('supabase-demo') &&
    serviceKey !== 'placeholder-service-key' &&
    serviceKey.length > 50

  const activeKey = isGenuineServiceKey
    ? serviceKey
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key')

  return createClient(supabaseUrl, activeKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

