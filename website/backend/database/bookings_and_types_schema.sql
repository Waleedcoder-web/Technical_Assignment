-- =====================================================================
-- HavenKey Real Estate Management Platform - Database Migration
-- Booking Types, Bookings, and Agreement Association
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Booking Types Lookup Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'calendar_month',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial booking types
INSERT INTO booking_types (type_name, slug, description, icon) VALUES
    ('In-Person Private Viewing', 'in_person', 'Walk through the property on-site with a verified HavenKey agent or owner.', 'person'),
    ('Live Video Tour', 'video_tour', 'Virtual guided interactive walkthrough via video call.', 'videocam'),
    ('Technical Property Inspection', 'inspection', 'Comprehensive inspection of structure, plumbing, electrical, and HVAC.', 'engineering')
ON CONFLICT (slug) DO NOTHING;

-- RLS for booking_types
ALTER TABLE booking_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on booking_types" ON booking_types FOR SELECT USING (true);
CREATE POLICY "Allow public insert on booking_types" ON booking_types FOR INSERT WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 2. Bookings Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    booking_type VARCHAR(50) REFERENCES booking_types(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50) NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    notes TEXT,
    agreed_to_terms BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner ON bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(booking_type);

-- RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on bookings" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on bookings" ON bookings FOR DELETE USING (true);

-- ---------------------------------------------------------------------
-- 3. Link Existing Agreements Table with Bookings
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agreements') THEN
        ALTER TABLE agreements ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_agreements_booking ON agreements(booking_id);
    END IF;
END $$;
