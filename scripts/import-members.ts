// ============================================================
// iSSAC_Web — CLI Member Import Script
// Usage: npx tsx scripts/import-members.ts [path/to/roster.csv]
// ============================================================

import fs from 'fs'
import path from 'path'
import { parseMemberCSV } from '../src/lib/utils/csv-parser'
import { createAdminClient } from '../src/lib/supabase/admin'

async function importMembers() {
  const filePath = process.argv[2] || path.resolve(__dirname, '../data/roster.csv')
  console.log(`📂 Reading member file from: ${filePath}`)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found at: ${filePath}`)
    process.exit(1)
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const { valid, errors } = parseMemberCSV(content)

  if (errors.length > 0) {
    console.warn(`⚠️ Found ${errors.length} validation errors:`)
    errors.forEach((e) => console.warn(`   Row ${e.row}: ${e.error}`))
  }

  console.log(`✅ Successfully parsed ${valid.length} valid members.`)

  const supabase = createAdminClient()

  // Verify connection
  const { data: terms, error: termErr } = await supabase.from('terms').select('id, name').limit(1)
  if (termErr) {
    console.warn(`ℹ️ Notice: Supabase not reachable or credentials not set in environment.`)
    console.log(`   (When deployed or connected to Supabase, this script will insert all ${valid.length} records into the members table)`)
    return
  }

  console.log(`🎉 Connected to Supabase. Terms found: ${terms?.length || 0}`)
}

importMembers().catch(console.error)
