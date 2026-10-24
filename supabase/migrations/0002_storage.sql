-- ==============================================================================
-- CivilEdge IAS — Supabase Storage Buckets & Policies
-- Buckets: handouts, resources, avatars
-- ==============================================================================

-- Create buckets if storage schema exists
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('handouts', 'handouts', true),
  ('resources', 'resources', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Handouts: Public read
CREATE POLICY "Handouts are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'handouts');

-- Resources: Public read
CREATE POLICY "Resources are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resources');

-- Avatars: Public read, authenticated user upload
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');
