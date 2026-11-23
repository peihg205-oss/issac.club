-- ============================================================
-- iSSAC Financial Management & SePay Payment System
-- Migration: 20261123_create_financial_management_tables.sql
-- ============================================================

-- 1. Fund Collection Campaigns Table
CREATE TABLE IF NOT EXISTS issac_fund_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    default_amount NUMERIC(15, 2) NOT NULL DEFAULT 100000,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 48,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for public lookup by slug
CREATE INDEX IF NOT EXISTS idx_issac_campaigns_slug ON issac_fund_campaigns(slug);

-- 2. Member Single-Use Payment Intents Table
CREATE TABLE IF NOT EXISTS issac_payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES issac_fund_campaigns(id) ON DELETE RESTRICT,
    campaign_slug VARCHAR(100) NOT NULL,
    campaign_title VARCHAR(255) NOT NULL,
    member_code VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payment_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. ISSAC8F3K9P2A
    qr_url TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'success', 'expired', 'disputed', 'waived')),
    sepay_transaction_id VARCHAR(100),
    paid_amount NUMERIC(15, 2),
    paid_at TIMESTAMPTZ,
    evidence_url TEXT,
    evidence_file_name VARCHAR(255),
    evidence_uploaded_at TIMESTAMPTZ,
    dispute_reason TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issac_payment_code ON issac_payment_intents(payment_code);
CREATE INDEX IF NOT EXISTS idx_issac_payment_student_campaign ON issac_payment_intents(student_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_issac_payment_sepay_id ON issac_payment_intents(sepay_transaction_id);

-- 3. Append-Only Financial Ledger Table (Sổ cái bất biến)
CREATE TABLE IF NOT EXISTS issac_financial_ledger (
    entry_number BIGSERIAL,
    id VARCHAR(50) PRIMARY KEY, -- e.g. BT-00128
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'ADJUSTMENT')),
    category VARCHAR(50) NOT NULL,
    category_label VARCHAR(255),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    member_code VARCHAR(50),
    member_name VARCHAR(255),
    campaign_id UUID REFERENCES issac_fund_campaigns(id) ON DELETE SET NULL,
    campaign_title VARCHAR(255),
    payment_code VARCHAR(50),
    sepay_transaction_id VARCHAR(100),
    reference_entry_id VARCHAR(50) REFERENCES issac_financial_ledger(id),
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'approved', 'reconciled', 'adjusted')),
    actor VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_issac_ledger_timestamp ON issac_financial_ledger(timestamp);
CREATE INDEX IF NOT EXISTS idx_issac_ledger_member_code ON issac_financial_ledger(member_code);
CREATE INDEX IF NOT EXISTS idx_issac_ledger_payment_code ON issac_financial_ledger(payment_code);
CREATE INDEX IF NOT EXISTS idx_issac_ledger_sepay_id ON issac_financial_ledger(sepay_transaction_id);

-- Enforce IMMUTABLE APPEND-ONLY via Trigger: NO UPDATES OR DELETES ALLOWED
CREATE OR REPLACE FUNCTION fn_prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'VI PHẠM BẢO VỆ DỮ LIỆU: Sổ cái tài chính iSSAC (issac_financial_ledger) là append-only bất biến. Tuyệt đối không cho phép SỬA (UPDATE) hoặc XÓA (DELETE). Mọi điều chỉnh phải được thực hiện bằng bút toán đảo ADJUSTMENT.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_ledger_update ON issac_financial_ledger;
CREATE TRIGGER trg_prevent_ledger_update
BEFORE UPDATE ON issac_financial_ledger
FOR EACH ROW EXECUTE FUNCTION fn_prevent_ledger_mutation();

DROP TRIGGER IF EXISTS trg_prevent_ledger_delete ON issac_financial_ledger;
CREATE TRIGGER trg_prevent_ledger_delete
BEFORE DELETE ON issac_financial_ledger
FOR EACH ROW EXECUTE FUNCTION fn_prevent_ledger_mutation();

-- 4. Expense Requests Table with Segregation of Duties Check
CREATE TABLE IF NOT EXISTS issac_expense_requests (
    id VARCHAR(50) PRIMARY KEY, -- e.g. EXP-2026-001
    category VARCHAR(50) NOT NULL,
    category_label VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    description TEXT,
    recipient VARCHAR(255) NOT NULL,
    related_event VARCHAR(255),
    evidence_url TEXT,
    evidence_file_name VARCHAR(255),
    creator_id VARCHAR(50) NOT NULL,
    creator_name VARCHAR(255) NOT NULL,
    creator_role VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approver_id VARCHAR(50),
    approver_name VARCHAR(255),
    approver_role VARCHAR(100),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    ledger_entry_id VARCHAR(50) REFERENCES issac_financial_ledger(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforce Segregation of Duties: Creator CANNOT be the Approver!
    CONSTRAINT chk_segregation_of_duties CHECK (creator_id <> approver_id)
);

CREATE INDEX IF NOT EXISTS idx_issac_expenses_status ON issac_expense_requests(status);

-- 5. Payment Evidence Records Table
CREATE TABLE IF NOT EXISTS issac_payment_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id UUID REFERENCES issac_payment_intents(id) ON DELETE CASCADE,
    payment_code VARCHAR(50) NOT NULL,
    member_code VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- 6. Financial Audit Logs Table with SHA-256 Hash Chaining
CREATE TABLE IF NOT EXISTS issac_financial_audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    actor VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_record VARCHAR(100) NOT NULL,
    details TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_issac_audit_timestamp ON issac_financial_audit_logs(timestamp);

