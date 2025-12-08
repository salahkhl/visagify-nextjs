-- Temporarily disable the trigger to test signup without automatic profile creation
-- This will help us identify if the trigger is causing the 500 error

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- We'll manually create profiles later or re-enable the trigger once we fix the issue


