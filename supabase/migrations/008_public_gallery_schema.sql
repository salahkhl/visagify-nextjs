-- Public Gallery Schema for OnlyFaceSwap Scraper
-- This extends the existing Visagify schema with public gallery functionality

-- Studios table
CREATE TABLE studios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Models table
CREATE TABLE models (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table (includes both tags and categories)
CREATE TABLE tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug VARCHAR UNIQUE NOT NULL,
  label VARCHAR NOT NULL,
  is_category BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Albums table (public gallery albums)
CREATE TABLE albums (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug VARCHAR UNIQUE NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  studio_id UUID REFERENCES studios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Images table (public gallery images)
CREATE TABLE images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  image_url VARCHAR NOT NULL,
  title VARCHAR,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Album-Model relationships (many-to-many)
CREATE TABLE albums_models (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(album_id, model_id)
);

-- Album-Tag relationships (many-to-many)
CREATE TABLE albums_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(album_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX idx_studios_slug ON studios(slug);
CREATE INDEX idx_models_slug ON models(slug);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_is_category ON tags(is_category);
CREATE INDEX idx_albums_slug ON albums(slug);
CREATE INDEX idx_albums_studio ON albums(studio_id);
CREATE INDEX idx_images_album ON images(album_id);
CREATE INDEX idx_albums_models_album ON albums_models(album_id);
CREATE INDEX idx_albums_models_model ON albums_models(model_id);
CREATE INDEX idx_albums_tags_album ON albums_tags(album_id);
CREATE INDEX idx_albums_tags_tag ON albums_tags(tag_id);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on public gallery tables
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums_tags ENABLE ROW LEVEL SECURITY;

-- Public read access for all gallery content (everyone can view)
CREATE POLICY "Anyone can view studios" ON studios FOR SELECT USING (true);
CREATE POLICY "Anyone can view models" ON models FOR SELECT USING (true);
CREATE POLICY "Anyone can view tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Anyone can view albums" ON albums FOR SELECT USING (true);
CREATE POLICY "Anyone can view images" ON images FOR SELECT USING (true);
CREATE POLICY "Anyone can view album-model relationships" ON albums_models FOR SELECT USING (true);
CREATE POLICY "Anyone can view album-tag relationships" ON albums_tags FOR SELECT USING (true);

-- Admin-only write access for gallery content
CREATE POLICY "Admins can manage studios" ON studios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage models" ON models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage albums" ON albums
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage images" ON images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage album-model relationships" ON albums_models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage album-tag relationships" ON albums_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Special policy for scraper operations (bypass RLS when using service role key)
-- Note: The scraper should use the service_role key, not the anon key
-- Service role key bypasses RLS automatically, so no special policies needed

-- Create some useful views for the frontend
CREATE VIEW album_details AS
SELECT 
  a.id,
  a.slug,
  a.title,
  a.description,
  a.created_at,
  s.name as studio_name,
  s.slug as studio_slug,
  COUNT(DISTINCT i.id) as image_count,
  COUNT(DISTINCT am.model_id) as model_count,
  COUNT(DISTINCT at.tag_id) as tag_count
FROM albums a
LEFT JOIN studios s ON a.studio_id = s.id
LEFT JOIN images i ON a.id = i.album_id
LEFT JOIN albums_models am ON a.id = am.album_id
LEFT JOIN albums_tags at ON a.id = at.album_id
GROUP BY a.id, a.slug, a.title, a.description, a.created_at, s.name, s.slug;

-- View for album with models and tags
CREATE VIEW album_with_metadata AS
SELECT 
  a.id,
  a.slug,
  a.title,
  a.description,
  a.created_at,
  s.name as studio_name,
  s.slug as studio_slug,
  COALESCE(
    JSON_AGG(DISTINCT jsonb_build_object('id', m.id, 'name', m.name, 'slug', m.slug)) 
    FILTER (WHERE m.id IS NOT NULL), 
    '[]'::json
  ) as models,
  COALESCE(
    JSON_AGG(DISTINCT jsonb_build_object('id', t.id, 'label', t.label, 'slug', t.slug, 'is_category', t.is_category)) 
    FILTER (WHERE t.id IS NOT NULL), 
    '[]'::json
  ) as tags
FROM albums a
LEFT JOIN studios s ON a.studio_id = s.id
LEFT JOIN albums_models am ON a.id = am.album_id
LEFT JOIN models m ON am.model_id = m.id
LEFT JOIN albums_tags at ON a.id = at.album_id
LEFT JOIN tags t ON at.tag_id = t.id
GROUP BY a.id, a.slug, a.title, a.description, a.created_at, s.name, s.slug;

-- Grant permissions on views
GRANT SELECT ON album_details TO anon, authenticated;
GRANT SELECT ON album_with_metadata TO anon, authenticated;











