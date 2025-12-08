-- Create table for custom email confirmations
CREATE TABLE email_confirmations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('signup', 'password_reset', 'email_change')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_email_confirmations_token ON email_confirmations(token);
CREATE INDEX idx_email_confirmations_email ON email_confirmations(email);
CREATE INDEX idx_email_confirmations_expires_at ON email_confirmations(expires_at);

-- Enable RLS
ALTER TABLE email_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS policies for email confirmations
CREATE POLICY "Service role can manage email confirmations" ON email_confirmations
  FOR ALL USING (true); -- Only service role should access this table

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_email_confirmations()
RETURNS void AS $$
BEGIN
  DELETE FROM email_confirmations 
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up expired tokens (optional)
-- You can set this up in Supabase Dashboard > Database > Cron Jobs if available


