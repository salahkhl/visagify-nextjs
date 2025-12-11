-- Credit Purchases Table
-- Stores all credit purchases made through Stripe

CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_session_id TEXT UNIQUE NOT NULL,
    stripe_payment_intent TEXT,
    email TEXT,
    user_id UUID REFERENCES auth.users(id),
    credits_purchased INTEGER NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'completed',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credit_purchases_email ON credit_purchases(email);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_stripe_session ON credit_purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created_at ON credit_purchases(created_at DESC);

-- RLS Policies
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (from webhook)
CREATE POLICY "Service role can insert credit purchases"
    ON credit_purchases
    FOR INSERT
    WITH CHECK (true);

-- Users can view their own purchases by email
CREATE POLICY "Users can view own purchases"
    ON credit_purchases
    FOR SELECT
    USING (email = auth.jwt() ->> 'email');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_credit_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_credit_purchases_updated_at
    BEFORE UPDATE ON credit_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_credit_purchases_updated_at();




