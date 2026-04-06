-- Create storage bucket for domain logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('domain-logos', 'domain-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for domain logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'domain-logos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload domain logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'domain-logos');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update domain logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'domain-logos');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete domain logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'domain-logos');