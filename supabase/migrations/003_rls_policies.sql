-- Enable RLS on all user-owned tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_swap_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_swap_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_swap_job_items ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Face swap credits policies
CREATE POLICY "Users can view own credits" ON face_swap_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON face_swap_credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credits" ON face_swap_credits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all credits" ON face_swap_credits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all subscriptions" ON subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Payment transactions policies
CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all transactions" ON payment_transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Faces policies
CREATE POLICY "Users can view own faces" ON faces
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own faces" ON faces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own faces" ON faces
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own faces" ON faces
  FOR DELETE USING (auth.uid() = user_id);

-- Face swap jobs policies
CREATE POLICY "Users can view own jobs" ON face_swap_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON face_swap_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON face_swap_jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all jobs" ON face_swap_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Face swap job items policies
CREATE POLICY "Users can view own job items" ON face_swap_job_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM face_swap_jobs 
      WHERE id = face_swap_job_items.job_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own job items" ON face_swap_job_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM face_swap_jobs 
      WHERE id = face_swap_job_items.job_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own job items" ON face_swap_job_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM face_swap_jobs 
      WHERE id = face_swap_job_items.job_id AND user_id = auth.uid()
    )
  );

-- Allow public read access to subscription plans and credit packages
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view credit packages" ON credit_packages
  FOR SELECT USING (true);

-- Only admins can modify plans and packages
CREATE POLICY "Admins can manage subscription plans" ON subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage credit packages" ON credit_packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


