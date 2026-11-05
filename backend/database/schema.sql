-- =====================================================================
-- HavenKey Real Estate Management Platform - Database Schema
-- Supabase / PostgreSQL Setup Script
-- =====================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Roles Table
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default platform roles
INSERT INTO roles (role_name) VALUES 
    ('tenant'),
    ('landlord'),
    ('admin')
ON CONFLICT (role_name) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Users Table
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_no VARCHAR(50),
    cnic VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    adress TEXT,
    postal_code VARCHAR(20),
    role VARCHAR(50) REFERENCES roles(role_name) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cnic ON users(cnic);
CREATE INDEX idx_users_role ON users(role);

-- ---------------------------------------------------------------------
-- 3. Properties Table
-- Exact user fields:
-- id, owner_id, title, description, property_type, listing_type,
-- price, area_value, area_unit, bedroom, bathroom, location, address, status
-- ---------------------------------------------------------------------
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) NOT NULL, -- e.g. villas, apartments, flats, plots
    listing_type VARCHAR(50) NOT NULL,  -- e.g. rent, sale
    price NUMERIC(15, 2) NOT NULL,
    area_value NUMERIC(10, 2) NOT NULL, -- e.g. 10, 1, 500
    area_unit VARCHAR(50) NOT NULL DEFAULT 'Marla', -- e.g. Marla, Kanal, Sq Ft
    bedroom INT NOT NULL DEFAULT 0,
    bathroom INT NOT NULL DEFAULT 0,
    location VARCHAR(255) NOT NULL,    -- City / Major Area (e.g. Lahore, Clifton Karachi)
    address TEXT NOT NULL,             -- Detailed Street / Sector Address
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- e.g. available, rented, sold, pending
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for properties
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_listing_type ON properties(listing_type);
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_status ON properties(status);

-- ---------------------------------------------------------------------
-- 4. Row Level Security (RLS) Configuration
-- ---------------------------------------------------------------------
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated and anonymous users
CREATE POLICY "Allow public read access on roles" ON roles
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on users" ON users
    FOR UPDATE USING (true);

-- Properties RLS policies (Full public CRUD for website submissions)
CREATE POLICY "Allow public read access on properties" ON properties
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on properties" ON properties
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on properties" ON properties
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on properties" ON properties
    FOR DELETE USING (true);

-- ---------------------------------------------------------------------
-- 5. Initial Seed Data (Users only - NO mock property data)
-- ---------------------------------------------------------------------
INSERT INTO users (fullname, email, phone_no, cnic, password, adress, postal_code, role)
VALUES 
    (
        'admin admin',
        'admin@gmail.com',
        '+92 300 0000000',
        '61101-0000000-1',
        '$2b$10$ZrXXjspsIEcv5zEOA.7D.OQ3gY4b1IFN1ZGiCUvbVYq.MADIvs37e', -- Admin@12345
        'HavenKey Operations HQ, Islamabad',
        '44000',
        'admin'
    ),
    (
        'Waleed Hassan',
        'waleed@havenkey.pk',
        '+92 300 1234567',
        '61101-1234567-1',
        'demo_hashed_pass_123',
        'House 42, Street 10, F-7/2',
        '44000',
        'tenant'
    ),
    (
        'Ahmed Khan',
        'ahmed.khan@havenkey.pk',
        '+92 300 7654321',
        '42201-9876543-1',
        'demo_hashed_pass_123',
        'Villa 18, Block 4, Clifton, Karachi',
        '75600',
        'landlord'
    )
ON CONFLICT (email) DO NOTHING;
