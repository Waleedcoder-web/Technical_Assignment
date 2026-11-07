-- =====================================================================
-- HavenKey Real Estate Management Platform - Database Migration
-- Agreements and Complaints Tables
-- =====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Agreements Table (Lease & Tenancy Contracts)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES users(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent NUMERIC(15, 2) NOT NULL,
    security_deposit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    agreement_doc TEXT, -- Document URL / PDF file path
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, pending, expired, terminated
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for agreements
CREATE INDEX IF NOT EXISTS idx_agreements_property ON agreements(property_id);
CREATE INDEX IF NOT EXISTS idx_agreements_owner ON agreements(owner_id);
CREATE INDEX IF NOT EXISTS idx_agreements_tenant ON agreements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_dates ON agreements(start_date, end_date);

-- Row Level Security (RLS) for agreements
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on agreements" ON agreements
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on agreements" ON agreements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on agreements" ON agreements
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on agreements" ON agreements
    FOR DELETE USING (true);

-- ---------------------------------------------------------------------
-- 2. Complaints Table (Facility & Maintenance Tickets)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    agreement_id UUID REFERENCES agreements(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, resolved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for complaints
CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_property ON complaints(property_id);
CREATE INDEX IF NOT EXISTS idx_complaints_agreement ON complaints(agreement_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);

-- Row Level Security (RLS) for complaints
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on complaints" ON complaints
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on complaints" ON complaints
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on complaints" ON complaints
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on complaints" ON complaints
    FOR DELETE USING (true);
