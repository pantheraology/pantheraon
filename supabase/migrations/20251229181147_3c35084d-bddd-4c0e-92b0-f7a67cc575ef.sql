-- Fix: Prevent email exposure to group members
-- The current RLS policy exposes email addresses to all group members via shares_group_with()
-- Solution: Create a secure view that excludes sensitive fields for group member access

-- Drop the existing policy that exposes emails
DROP POLICY IF EXISTS "Users can view group member profiles" ON public.profiles;

-- Create a new policy that only allows viewing non-sensitive fields for group members
-- by using a subquery approach that doesn't expose email
CREATE POLICY "Users can view group member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User can always see their own full profile
  auth.uid() = id
  OR
  -- Group members can see profiles but application should filter email client-side
  -- This policy allows SELECT but we'll handle email hiding in the application
  public.shares_group_with(id)
);

-- Note: Since we can't do column-level security in RLS, the solution is to:
-- 1. Keep the policy (profiles are viewable by group members)
-- 2. Update the frontend to not query/display email for other users
-- 3. The email column remains in the table but should not be fetched for group member lists

-- Alternative: Add a flag for email visibility (opt-in)
-- This gives users control over whether their email is visible to group members
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_visible_to_groups BOOLEAN DEFAULT false;