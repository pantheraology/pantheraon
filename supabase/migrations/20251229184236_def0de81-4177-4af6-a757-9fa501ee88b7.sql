-- Fix: Remove email from profiles table to prevent PII exposure
-- Email already exists in auth.users - this is the single source of truth
-- Users can access their own email via Supabase Auth API

-- Step 1: Drop the email column and the visibility flag
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email_visible_to_groups;

-- Step 2: Update the handle_new_user trigger to not copy email to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;