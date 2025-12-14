-- Subscriptions Table
-- Stores all subscription information from Stripe
-- Implements: Credits Top-Up to Monthly Max + Storage Quotas

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
    plan_id TEXT NOT NULL, -- 'free', 'basic', 'pro', 'ultra'
    billing_period TEXT NOT NULL, -- 'monthly', 'yearly'
    credits_per_month INTEGER NOT NULL, -- -1 for unlimited
    storage_included_mb INTEGER NOT NULL DEFAULT 50, -- Storage quota in MB
    storage_used_mb INTEGER NOT NULL DEFAULT 0, -- Current storage usage
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trialing', 'past_due', 'canceled', 'incomplete'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    last_storage_check TIMESTAMP WITH TIME ZONE, -- Last time storage was checked for billing
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

-- View to get active subscription for a user with storage info
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
    storage_included_mb,
    storage_used_mb,
    status,
    current_period_start,
    current_period_end,
    trial_end,
    cancel_at_period_end,
    canceled_at,
    last_storage_check,
    created_at,
    updated_at,
    -- Computed fields
    CASE 
        WHEN plan_id = 'ultra' THEN true
        ELSE false
    END as is_unlimited,
    CASE 
        WHEN storage_used_mb > storage_included_mb THEN true
        ELSE false
    END as is_over_storage_quota,
    GREATEST(0, storage_used_mb - storage_included_mb) as storage_overage_mb,
    CEIL(GREATEST(0, storage_used_mb - storage_included_mb)::numeric / 250) as storage_overage_blocks,
    CEIL(GREATEST(0, storage_used_mb - storage_included_mb)::numeric / 250) as storage_overage_charge_usd
FROM subscriptions
WHERE status IN ('active', 'trialing')
  AND (cancel_at_period_end = false OR current_period_end > NOW());

-- Grant access
GRANT SELECT ON user_active_subscriptions TO authenticated;
GRANT ALL ON subscriptions TO service_role;

-- ============================================
-- User Credits Table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id),
    balance INTEGER NOT NULL DEFAULT 0,
    lifetime_purchased INTEGER NOT NULL DEFAULT 0, -- Total credits ever purchased
    lifetime_used INTEGER NOT NULL DEFAULT 0, -- Total credits ever used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Enable RLS on user_credits
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Service role can manage user credits" ON user_credits;
    DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
EXCEPTION WHEN undefined_table THEN
    NULL;
END $$;

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage user credits"
    ON user_credits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Users can view their own credits
CREATE POLICY "Users can view own credits"
    ON user_credits
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Trigger for updated_at on user_credits
CREATE OR REPLACE FUNCTION update_user_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_credits_updated_at ON user_credits;
CREATE TRIGGER trigger_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_user_credits_updated_at();

-- ============================================
-- Function to calculate storage usage for a user
-- ============================================
CREATE OR REPLACE FUNCTION calculate_user_storage_mb(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_bytes BIGINT;
BEGIN
    -- This should query your actual storage tables (swap results, faces, etc.)
    -- For now, returns 0 - implement based on your actual schema
    SELECT COALESCE(SUM(size_bytes), 0) INTO total_bytes
    FROM (
        -- Add your actual storage tables here
        -- Example: SELECT file_size as size_bytes FROM user_files WHERE user_id = p_user_id
        SELECT 0 as size_bytes WHERE FALSE
    ) storage;
    
    RETURN CEIL(total_bytes::numeric / (1024 * 1024)); -- Convert to MB
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function to apply top-up credits logic
-- ============================================
CREATE OR REPLACE FUNCTION apply_subscription_credit_topup(
    p_user_id UUID,
    p_plan_credits_max INTEGER
)
RETURNS TABLE(
    previous_balance INTEGER,
    credits_added INTEGER,
    new_balance INTEGER
) AS $$
DECLARE
    v_current_balance INTEGER;
    v_credits_to_add INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT COALESCE(balance, 0) INTO v_current_balance
    FROM user_credits
    WHERE user_id = p_user_id;
    
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;
    
    -- Calculate credits to add (top-up to max)
    IF p_plan_credits_max = -1 THEN
        -- Unlimited plan: add 10,000 credits
        v_credits_to_add := 10000;
    ELSIF v_current_balance >= p_plan_credits_max THEN
        -- Already at or above max
        v_credits_to_add := 0;
    ELSE
        -- Top up to max
        v_credits_to_add := p_plan_credits_max - v_current_balance;
    END IF;
    
    v_new_balance := v_current_balance + v_credits_to_add;
    
    -- Update or insert credits
    INSERT INTO user_credits (user_id, balance, updated_at)
    VALUES (p_user_id, v_new_balance, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = v_new_balance,
        updated_at = NOW();
    
    RETURN QUERY SELECT v_current_balance, v_credits_to_add, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_user_storage_mb(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION apply_subscription_credit_topup(UUID, INTEGER) TO service_role;
