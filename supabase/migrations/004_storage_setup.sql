-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('faces', 'faces', false),
('swap-results', 'swap-results', false);

-- Storage policies for faces bucket
CREATE POLICY "Users can upload own faces" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'faces' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own faces" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'faces' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own faces" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'faces' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own faces" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'faces' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for swap-results bucket
CREATE POLICY "Users can view own swap results" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'swap-results' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "System can insert swap results" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'swap-results');

-- Admin policies for storage
CREATE POLICY "Admins can view all faces" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'faces' AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all swap results" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'swap-results' AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


