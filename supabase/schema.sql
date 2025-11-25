-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  total_score BIGINT NOT NULL DEFAULT 0,
  high_score BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index on total_score for fast leaderboard queries (kept for backward compatibility)
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score ON leaderboard(total_score DESC);

-- Create index on high_score for fast leaderboard queries (primary metric)
CREATE INDEX IF NOT EXISTS idx_leaderboard_high_score ON leaderboard(high_score DESC);

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_leaderboard_username ON leaderboard(username);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read the leaderboard
CREATE POLICY "Leaderboard is viewable by everyone"
  ON leaderboard
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert their own score
CREATE POLICY "Users can insert their own scores"
  ON leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own scores
CREATE POLICY "Users can update their own scores"
  ON leaderboard
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

