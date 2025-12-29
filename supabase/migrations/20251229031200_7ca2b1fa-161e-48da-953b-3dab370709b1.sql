-- Add theme_preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN theme_preference text DEFAULT 'space-blue';

-- Add deleted_at to conversations for soft delete
ALTER TABLE public.conversations 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;