-- Subscriptions Table
-- Stores all subscription information from Stripe

-- Clean up existing objects first
DROP VIEW IF EXISTS user_active_subscriptions CASCADE;
DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions;
DROP FUNCTION IF EXISTS update_subscriptions_updated_at() CASCADE;

-- Drop existing policies (ignore errors if they don't exist)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
    DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist yet, that's fine
    NULL;
END $$;

-- Drop and recreate table to ensure correct schema
DROP TABLE IF EXISTS subscriptions CASCADE;

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    plan_id TEXT NOT NULL,
    billing_period TEXT NOT NULL,
    credits_per_month INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_email ON subscriptions(email);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (for webhook operations)
CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON subscriptions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- View to get active subscription for a user
CREATE VIEW user_active_subscriptions AS
SELECT 
    id,
    stripe_subscription_id,
    stripe_customer_id,
    user_id,
    email,
    plan_id,
    billing_period,
    credits_per_month,
    status,
    current_period_start,
    current_period_end,
    trial_end,
    cancel_at_period_end,
    canceled_at,
    created_at,
    updated_at,
    CASE 
        WHEN plan_id = 'ultra' THEN true
        ELSE false
    END as is_unlimited
FROM subscriptions
WHERE status IN ('active', 'trialing')
  AND (cancel_at_period_end = false OR current_period_end > NOW());

-- Grant access
GRANT SELECT ON user_active_subscriptions TO authenticated;
GRANT ALL ON subscriptions TO service_role;
