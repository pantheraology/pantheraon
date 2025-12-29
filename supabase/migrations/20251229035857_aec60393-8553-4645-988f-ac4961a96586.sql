-- Create studio_generations table
CREATE TABLE public.studio_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio')),
  prompt TEXT NOT NULL,
  result_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.studio_generations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own generations"
ON public.studio_generations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generations"
ON public.studio_generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations"
ON public.studio_generations FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_studio_generations_user_id ON public.studio_generations(user_id);
CREATE INDEX idx_studio_generations_type ON public.studio_generations(type);

-- Create storage bucket for studio assets
INSERT INTO storage.buckets (id, name, public) VALUES ('studio-assets', 'studio-assets', true);

-- Storage policies
CREATE POLICY "Users can upload studio assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'studio-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their studio assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'studio-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their studio assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'studio-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view studio assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'studio-assets');