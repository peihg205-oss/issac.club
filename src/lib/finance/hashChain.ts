import crypto from 'crypto'
import type { FinancialAuditLog, FinancialLedgerEntry } from '@/types/finance'

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000'

/**
 * Serializes transaction data in a deterministic, canonical key order.
 */
export function canonicalizeLedgerData(
  entry: Omit<FinancialLedgerEntry, 'currentHash' | 'previousHash'>
): string {
  const canonicalObj = {
    actor: entry.actor,
    amount: entry.amount,
    campaignId: entry.campaignId || '',
    category: entry.category,
    description: entry.description,
    entryNumber: entry.entryNumber,
    id: entry.id,
    memberCode: entry.memberCode || '',
    paymentCode: entry.paymentCode || '',
    referenceEntryId: entry.referenceEntryId || '',
    sepayTransactionId: entry.sepayTransactionId || '',
    status: entry.status,
    timestamp: entry.timestamp,
    type: entry.type,
  }
  return JSON.stringify(canonicalObj)
}

/**
 * Computes SHA-256 hash for a ledger entry chained with its previousHash.
 */
export function calculateEntryHash(
  previousHash: string,
  entry: Omit<FinancialLedgerEntry, 'currentHash' | 'previousHash'>
): string {
  const canonical = canonicalizeLedgerData(entry)
  return crypto
    .createHash('sha256')
    .update(`${previousHash}:${canonical}`)
    .digest('hex')
}

/**
 * Verifies the integrity of an entire ledger chain.
 * Returns valid = true if every hash matches the previous hash and entry content.
 */
export function verifyLedgerIntegrity(entries: FinancialLedgerEntry[]): {
  valid: boolean
  errorIndex?: number
  reason?: string
} {
  if (!entries || entries.length === 0) {
    return { valid: true }
  }

  let expectedPrevHash = GENESIS_HASH

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]

    if (entry.previousHash !== expectedPrevHash) {
      return {
        valid: false,
        errorIndex: i,
        reason: `Mất liên kết chuỗi tại bản ghi #${entry.entryNumber} (${entry.id}). previousHash (${entry.previousHash}) không khớp hash trước đó (${expectedPrevHash}).`,
      }
    }

    const calculatedHash = calculateEntryHash(entry.previousHash, entry)
    if (calculatedHash !== entry.currentHash) {
      return {
        valid: false,
        errorIndex: i,
        reason: `Dữ liệu bị can thiệp tại bản ghi #${entry.entryNumber} (${entry.id}). Hash tính toán (${calculatedHash.slice(0, 12)}...) không khớp currentHash (${entry.currentHash.slice(0, 12)}...).`,
      }
    }

    expectedPrevHash = entry.currentHash
  }

  return { valid: true }
}

/**
 * Computes SHA-256 hash for audit logs.
 */
export function calculateAuditHash(
  previousHash: string,
  log: Omit<FinancialAuditLog, 'currentHash' | 'previousHash'>
): string {
  const canonical = JSON.stringify({
    action: log.action,
    actor: log.actor,
    actorRole: log.actorRole,
    details: log.details || '',
    id: log.id,
    targetRecord: log.targetRecord,
    timestamp: log.timestamp,
  })
  return crypto
    .createHash('sha256')
    .update(`${previousHash}:${canonical}`)
    .digest('hex')
}

