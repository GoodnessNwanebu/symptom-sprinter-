-- Users tracking table for analytics
-- Tracks unique players by their UUID

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL UNIQUE, -- The UUID generated client-side
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  session_count INTEGER NOT NULL DEFAULT 1,
  total_rounds_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index on player_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_player_id ON users(player_id);

-- Index on last_seen for active user queries
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);

-- Index on first_seen for growth tracking
CREATE INDEX IF NOT EXISTS idx_users_first_seen ON users(first_seen);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for tracking new users)
CREATE POLICY "Users can insert their own tracking data"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can update their own tracking data (by player_id)
CREATE POLICY "Users can update their own tracking data"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: No public reads (privacy - only admins can query)
-- If you want to allow reads, change to: USING (true)
CREATE POLICY "Users table is private"
  ON users
  FOR SELECT
  USING (false);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Helper function to track user visit (upsert)
CREATE OR REPLACE FUNCTION track_user_visit(p_player_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO users (player_id, last_seen, session_count)
  VALUES (p_player_id, TIMEZONE('utc', NOW()), 1)
  ON CONFLICT (player_id) 
  DO UPDATE SET 
    last_seen = TIMEZONE('utc', NOW()),
    session_count = users.session_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment rounds played
CREATE OR REPLACE FUNCTION increment_user_rounds(p_player_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET total_rounds_played = total_rounds_played + 1
  WHERE player_id = p_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get total users count (for admin/analytics)
CREATE OR REPLACE FUNCTION get_total_users()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get active users (last N days)
CREATE OR REPLACE FUNCTION get_active_users(days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM users 
    WHERE last_seen > TIMEZONE('utc', NOW()) - (days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

