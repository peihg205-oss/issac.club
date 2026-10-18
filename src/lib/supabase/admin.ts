import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  // Trích xuất project ref từ Supabase URL (ví dụ: zlywndixmencviklfgoq)
  let expectedRef = ''
  try {
    const hostname = new URL(supabaseUrl).hostname
    expectedRef = hostname.split('.')[0]
  } catch {}

  let isGenuineServiceKey = false
  if (serviceKey && serviceKey.length > 50) {
    try {
      const parts = serviceKey.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
        // Bỏ qua các key demo / placeholder không thuộc project thật
        if (payload.iss !== 'supabase-demo' && (!expectedRef || payload.ref === expectedRef)) {
          isGenuineServiceKey = true
        }
      }
    } catch {}
  }

  const activeKey = isGenuineServiceKey ? serviceKey! : anonKey

  return createClient(supabaseUrl, activeKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

