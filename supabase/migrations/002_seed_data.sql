-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, monthly_cost_usd, credits_per_month, stripe_price_id) VALUES
('Free', 0.00, 5, NULL),
('Basic', 9.99, 50, 'price_basic_monthly'),
('Pro', 19.99, 150, 'price_pro_monthly'),
('Premium', 39.99, 500, 'price_premium_monthly');

-- Insert credit packages
INSERT INTO credit_packages (package_name, usd_price, swap_credits, stripe_price_id) VALUES
('Starter Pack', 4.99, 10, 'price_credits_10'),
('Value Pack', 9.99, 25, 'price_credits_25'),
('Power Pack', 19.99, 60, 'price_credits_60'),
('Ultimate Pack', 39.99, 150, 'price_credits_150');

-- Function to create user profile and credits on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, username, role)
  VALUES (NEW.id, NEW.email, 'user');
  
  INSERT INTO face_swap_credits (user_id, balance)
  VALUES (NEW.id, 3); -- Give 3 free credits to new users
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile and credits for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


