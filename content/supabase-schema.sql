-- Create RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  attending BOOLEAN NOT NULL,
  guests SMALLINT NOT NULL DEFAULT 1 CHECK (guests >= 1 AND guests <= 2),
  notes TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(email);
CREATE INDEX IF NOT EXISTS idx_rsvps_attending ON rsvps(attending);

-- Enable Row Level Security
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts (for API)
CREATE POLICY "Allow insert rsvps" ON rsvps
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow read for service role only
CREATE POLICY "Allow read rsvps for service role" ON rsvps
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Insert seed data for development (3 dummy RSVPs)
INSERT INTO rsvps (full_name, email, attending, guests, notes)
VALUES
  ('Alex Guest', 'alex@example.com', true, 2, 'Looking forward to it!'),
  ('Sam Friend', 'sam@example.com', false, 0, 'Sorry, will be traveling'),
  ('Jordan Pal', 'jordan@example.com', true, 1, 'Vegetarian meal please');
