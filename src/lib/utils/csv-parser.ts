import Papa from 'papaparse'
import { MemberImportSchema, type MemberImportInput } from '../validators/member'

export interface ParseResult {
  valid: MemberImportInput[]
  errors: Array<{ row: number; error: string; raw: any }>
}

export function parseMemberCSV(csvContent: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim().toLowerCase(),
  })

  const valid: MemberImportInput[] = []
  const errors: Array<{ row: number; error: string; raw: any }> = []

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2 // 1-indexed + header row
    const result = MemberImportSchema.safeParse({
      source_stt: row.source_stt || row.stt,
      full_name: row.full_name || row['họ và tên'] || row['họ tên'],
      department: row.department || row.ban || row['ban chuyên môn'],
      position: row.position || row['chức vụ'] || 'Thành viên',
      student_id: row.student_id || row.mssv,
      class_name: row.class_name || row['lớp'] || row.lop,
      phone: row.phone || row['sđt'] || row.sdt,
      email: row.email,
    })

    if (result.success) {
      valid.push(result.data)
    } else {
      const issues = (result.error as any).issues || (result.error as any).errors || []
      const errorMsg = issues.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).join(', ')
      errors.push({ row: rowNum, error: errorMsg, raw: row })
    }
  })

  return { valid, errors }
}
