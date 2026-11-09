-- =====================================================================
-- HavenKey Real Estate Management Platform - Chat Logs Schema
-- =====================================================================

CREATE TABLE IF NOT EXISTS chat_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying by session, user, and time
CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user ON chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at DESC);

-- Row Level Security (RLS) Configuration
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert access for service role and public
CREATE POLICY "Allow public insert on chat_logs" ON chat_logs
    FOR INSERT WITH CHECK (true);

-- Allow read access
CREATE POLICY "Allow public read access on chat_logs" ON chat_logs
    FOR SELECT USING (true);
