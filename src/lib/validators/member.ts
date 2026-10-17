import { z } from 'zod'

export const MemberImportSchema = z.object({
  source_stt: z.coerce.number().optional(),
  full_name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').trim(),
  department: z.string().min(1, 'Ban không được để trống'),
  position: z.string().default('Thành viên'),
  student_id: z.string().trim().optional().nullable(),
  class_name: z.string().trim().optional().nullable(),
  phone: z
    .string()
    .trim()
    .transform((val) => {
      if (!val) return ''
      const cleaned = val.replace(/\s+/g, '')
      // pad leading zero if 9 digits
      if (cleaned.length === 9 && !cleaned.startsWith('0')) {
        return '0' + cleaned
      }
      return cleaned
    })
    .optional()
    .nullable(),
  email: z.string().email('Email không hợp lệ').trim().toLowerCase(),
})

export const ScoreProposalSchema = z.object({
  member_id: z.string().uuid('ID thành viên không hợp lệ'),
  criterion_code: z.string().min(3, 'Mã tiêu chí không hợp lệ'),
  event_id: z.string().uuid().optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  reason: z.string().min(5, 'Lý do chấm điểm tối thiểu 5 ký tự'),
  evidence_url: z.string().url('Minh chứng phải là URL hợp lệ').optional().nullable(),
  supersedes_rule_code: z.string().optional().nullable(),
})

export const CheckinSchema = z.object({
  member_code: z.string().min(2, 'Mã thành viên không được để trống').trim(),
  pin: z.string().min(4, 'Mã PIN tối thiểu 4 ký tự').max(8, 'Mã PIN tối đa 8 ký tự'),
  token: z.string().min(6, 'Mã check-in sự kiện không hợp lệ'),
  device_fingerprint: z.string().optional(),
})

export type MemberImportInput = z.infer<typeof MemberImportSchema>
export type ScoreProposalInput = z.infer<typeof ScoreProposalSchema>
export type CheckinInput = z.infer<typeof CheckinSchema>
