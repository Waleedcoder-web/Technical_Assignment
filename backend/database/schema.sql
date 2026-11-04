-- =====================================================================
-- HavenKey Real Estate Management Platform - Database Schema
-- Supabase / PostgreSQL Setup Script
-- =====================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Roles Table
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default roles
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

-- Create index on frequent query columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cnic ON users(cnic);
CREATE INDEX idx_users_role ON users(role);

-- ---------------------------------------------------------------------
-- 3. Row Level Security (RLS) Configuration
-- ---------------------------------------------------------------------
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated and anonymous users
CREATE POLICY "Allow public read access on roles" ON roles
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on users" ON users
    FOR UPDATE USING (true);

-- ---------------------------------------------------------------------
-- 4. Initial Seed Data
-- ---------------------------------------------------------------------
INSERT INTO users (fullname, email, phone_no, cnic, password, adress, postal_code, role)
VALUES 
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
    ),
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
        'Admin Operator',
        'admin@havenkey.pk',
        '+92 300 0000000',
        '61101-0000000-0',
        'admin_secure_pass_999',
        'HavenKey HQ, Blue Area, Islamabad',
        '44000',
        'admin'
    )
ON CONFLICT (email) DO NOTHING;
