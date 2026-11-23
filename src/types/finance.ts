// ============================================================
// iSSAC_Web - Financial Management & SePay Payment Types
// ============================================================

export type PaymentStatus =
  | 'pending'     // Chờ thanh toán
  | 'confirming'  // Đang xác nhận giao dịch
  | 'success'     // Thanh toán thành công
  | 'expired'     // Hết hạn
  | 'disputed'    // Cần đối soát / Bất thường
  | 'waived'      // Được miễn/hoàn phí

export type LedgerEntryType = 'INCOME' | 'EXPENSE' | 'ADJUSTMENT'

export type LedgerCategory =
  | 'fund_collection' // Thu quỹ sinh hoạt
  | 'event_fee'       // Phí sự kiện / Workshop
  | 'sponsorship'     // Tài trợ / Ủng hộ
  | 'materials'       // Chi vật tư / Trang phục / Standee
  | 'logistics'       // Chi hậu cần / Thuê địa điểm
  | 'food_drink'      // Chi ăn uống / Teambuilding
  | 'reward_prize'    // Chi khen thưởng
  | 'refund'          // Hoàn phí
  | 'reversal'        // Bút toán điều chỉnh sai sót
  | 'other'           // Khác

export type ExpenseStatus = 'pending' | 'approved' | 'rejected'

export type CampaignStatus = 'active' | 'closed' | 'draft'

export interface FundCampaign {
  id: string
  slug: string
  title: string
  description?: string
  defaultAmount: number
  startDate: string
  endDate: string
  targetCount: number
  status: CampaignStatus
  isFrozen?: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface PaymentIntent {
  id: string
  campaignId: string
  campaignSlug: string
  campaignTitle: string
  memberCode: string
  fullName: string
  studentId: string
  email: string
  phone: string
  amount: number
  paymentCode: string // Unique reference, e.g. ISSAC8F3K9P2A
  qrUrl: string
  status: PaymentStatus
  sepayTransactionId?: string
  paidAmount?: number
  paidAt?: string
  evidenceUrl?: string
  evidenceUploadedAt?: string
  evidenceFileName?: string
  disputeReason?: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface FinancialLedgerEntry {
  id: string // e.g. BT-00128
  entryNumber: number
  type: LedgerEntryType
  category: LedgerCategory
  categoryLabel?: string
  amount: number // Positive number for transaction value
  description: string
  memberCode?: string
  memberName?: string
  campaignId?: string
  campaignTitle?: string
  paymentCode?: string
  sepayTransactionId?: string
  referenceEntryId?: string // For adjustments/reversals
  status: 'confirmed' | 'approved' | 'reconciled' | 'adjusted'
  actor: string
  timestamp: string
  previousHash: string
  currentHash: string
}

export interface ExpenseRequest {
  id: string
  category: LedgerCategory
  categoryLabel: string
  amount: number
  reason: string
  description: string
  recipient: string
  relatedEvent?: string
  evidenceUrl?: string
  evidenceFileName?: string
  creatorId: string
  creatorName: string
  creatorRole: string
  status: ExpenseStatus
  approverId?: string
  approverName?: string
  approverRole?: string
  approvedAt?: string
  rejectionReason?: string
  ledgerEntryId?: string
  createdAt: string
}

export interface PaymentEvidence {
  id: string
  paymentIntentId: string
  paymentCode: string
  memberCode: string
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  uploadedAt: string
  metadata?: Record<string, any>
}

export interface SePayWebhookPayload {
  id: number | string
  gateway: string
  transactionDate: string
  accountNumber: string
  code?: string | null
  content: string
  transferType: 'in' | 'out'
  transferAmount: number
  accumulated: number
  subAccount?: string | null
  referenceCode?: string
  description?: string
}

export interface SePayTransactionRecord {
  id: string
  gateway: string
  transactionDate: string
  accountNumber: string
  code?: string | null
  content: string
  transferType: 'in' | 'out'
  transferAmount: number
  accumulated: number
  referenceCode?: string
  rawBody: string
  verifiedSignature: boolean
  isDuplicate: boolean
  matchedPaymentCode?: string
  paymentIntentId?: string
  status: 'matched' | 'unmatched' | 'disputed'
  createdAt: string
}

export interface FinancialAuditLog {
  id: string
  actor: string
  actorRole: string
  action: string
  targetRecord: string
  details?: string
  metadata?: Record<string, any>
  timestamp: string
  previousHash: string
  currentHash: string
}

export interface FinancialDashboardStats {
  totalIncome: number
  totalExpense: number
  balance: number
  totalTransactions: number
  paidMembersCount: number
  unpaidMembersCount: number
  pendingReconciliationCount: number
  activeCampaignsCount: number
}

