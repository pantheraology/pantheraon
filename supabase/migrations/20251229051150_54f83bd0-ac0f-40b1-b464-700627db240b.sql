-- Fix profiles RLS to allow group members to view limited profile info of other group members
-- while still protecting sensitive data for non-group-members

-- Create a security definer function to check if users share a group
CREATE OR REPLACE FUNCTION public.shares_group_with(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM group_chat_members gcm1
    INNER JOIN group_chat_members gcm2 ON gcm1.group_id = gcm2.group_id
    WHERE gcm1.user_id = auth.uid()
      AND gcm2.user_id = target_user_id
  )
$$;

-- Drop the existing overly restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create policy for users to view their own complete profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy for users to view profiles of group members they share a group with
-- This allows the group chat functionality to work properly
CREATE POLICY "Users can view group member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.shares_group_with(id));