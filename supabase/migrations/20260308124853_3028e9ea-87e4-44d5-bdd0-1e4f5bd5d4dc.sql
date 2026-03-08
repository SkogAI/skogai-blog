
-- Categories table
CREATE TABLE public.gallery_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_categories ENABLE ROW LEVEL SECURITY;

-- Public read for categories
CREATE POLICY "Anyone can view categories"
  ON public.gallery_categories FOR SELECT
  USING (true);

-- Only authenticated users can manage categories
CREATE POLICY "Authenticated users can insert categories"
  ON public.gallery_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON public.gallery_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON public.gallery_categories FOR DELETE
  TO authenticated
  USING (true);

-- Photos table
CREATE TABLE public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  alt_text text NOT NULL DEFAULT '',
  file_path text NOT NULL,
  thumbnail_path text,
  width integer,
  height integer,
  category_id uuid REFERENCES public.gallery_categories(id) ON DELETE SET NULL,
  photographer text,
  client text,
  location text,
  details text,
  sort_order integer NOT NULL DEFAULT 0,
  is_video boolean NOT NULL DEFAULT false,
  video_path text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- Public read for photos
CREATE POLICY "Anyone can view photos"
  ON public.gallery_photos FOR SELECT
  USING (true);

-- Only authenticated users can manage photos
CREATE POLICY "Authenticated users can insert photos"
  ON public.gallery_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update photos"
  ON public.gallery_photos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete photos"
  ON public.gallery_photos FOR DELETE
  TO authenticated
  USING (true);

-- Storage bucket for gallery uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('gallery', 'gallery', true, 52428800);

-- Storage policies
CREATE POLICY "Anyone can view gallery files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can upload gallery files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can update gallery files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'gallery')
  WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can delete gallery files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'gallery');

-- Seed default categories
INSERT INTO public.gallery_categories (name, slug, description, sort_order) VALUES
  ('Selected', 'selected', 'Curated selection of standout work', 1),
  ('Commissioned', 'commissioned', 'Commercial and commissioned projects', 2),
  ('Editorial', 'editorial', 'Editorial photography for publications', 3),
  ('Personal', 'personal', 'Personal and artistic projects', 4);
