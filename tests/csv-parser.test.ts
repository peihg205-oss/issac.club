import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parseMemberCSV } from '@/lib/utils/csv-parser'

describe('CSV Member Parser', () => {
  it('correctly parses real roster.csv with 48 members without critical errors', () => {
    const csvPath = path.resolve(__dirname, '../data/roster.csv')
    if (!fs.existsSync(csvPath)) {
      console.warn('data/roster.csv not present, skipping physical file test')
      return
    }

    const content = fs.readFileSync(csvPath, 'utf8')
    const { valid, errors } = parseMemberCSV(content)

    expect(valid.length).toBe(48)
    expect(errors.length).toBe(0)

    // Check first member (Staff / Chairwoman)
    const leader = valid[0]
    expect(leader.full_name).toBe('Nguyễn Thị Hồng Hân')
    expect(leader.department).toBe('BCN')
    expect(leader.position).toBe('Chủ nhiệm')

    // Check Vice Chairwoman with student ID
    const viceLeader = valid[1]
    expect(viceLeader.full_name).toBe('Giang Lê Hiệp')
    expect(viceLeader.student_id).toBe('23070691')
  })
})
