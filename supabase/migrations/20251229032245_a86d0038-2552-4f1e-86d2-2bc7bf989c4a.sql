-- Add username to profiles (unique, for invitations)
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create group_chats table
CREATE TABLE public.group_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on group_chats
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;

-- Create enum for member roles
CREATE TYPE public.group_member_role AS ENUM ('admin', 'member');

-- Create group_chat_members table
CREATE TABLE public.group_chat_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role group_member_role NOT NULL DEFAULT 'member',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS on group_chat_members
ALTER TABLE public.group_chat_members ENABLE ROW LEVEL SECURITY;

-- Create group_messages table
CREATE TABLE public.group_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on group_messages
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_group_chat_members_group_id ON public.group_chat_members(group_id);
CREATE INDEX idx_group_chat_members_user_id ON public.group_chat_members(user_id);
CREATE INDEX idx_group_messages_group_id ON public.group_messages(group_id);
CREATE INDEX idx_group_messages_created_at ON public.group_messages(created_at);

-- RLS Policies for group_chats
-- Users can view groups they are members of
CREATE POLICY "Users can view their groups"
ON public.group_chats
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_members.group_id = group_chats.id
    AND group_chat_members.user_id = auth.uid()
  )
);

-- Users can create groups
CREATE POLICY "Users can create groups"
ON public.group_chats
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Only admins can update groups
CREATE POLICY "Admins can update groups"
ON public.group_chats
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_members.group_id = group_chats.id
    AND group_chat_members.user_id = auth.uid()
    AND group_chat_members.role = 'admin'
  )
);

-- Only admins can delete groups
CREATE POLICY "Admins can delete groups"
ON public.group_chats
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_members.group_id = group_chats.id
    AND group_chat_members.user_id = auth.uid()
    AND group_chat_members.role = 'admin'
  )
);

-- RLS Policies for group_chat_members
-- Members can view other members in their groups
CREATE POLICY "Members can view group members"
ON public.group_chat_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members AS my_membership
    WHERE my_membership.group_id = group_chat_members.group_id
    AND my_membership.user_id = auth.uid()
  )
);

-- Admins can add members
CREATE POLICY "Admins can add members"
ON public.group_chat_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_members.group_id = group_chat_members.group_id
    AND group_chat_members.user_id = auth.uid()
    AND group_chat_members.role = 'admin'
  )
  OR 
  -- Allow creator to add themselves as first member
  (auth.uid() = user_id AND role = 'admin')
);

-- Admins can update member roles
CREATE POLICY "Admins can update members"
ON public.group_chat_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members AS admin_check
    WHERE admin_check.group_id = group_chat_members.group_id
    AND admin_check.user_id = auth.uid()
    AND admin_check.role = 'admin'
  )
);

-- Admins can remove members, or users can leave
CREATE POLICY "Admins can remove members or users can leave"
ON public.group_chat_members
FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.group_chat_members AS admin_check
    WHERE admin_check.group_id = group_chat_members.group_id
    AND admin_check.user_id = auth.uid()
    AND admin_check.role = 'admin'
  )
);

-- RLS Policies for group_messages
-- Members can view messages in their groups
CREATE POLICY "Members can view group messages"
ON public.group_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_members.group_id = group_messages.group_id
    AND group_chat_members.user_id = auth.uid()
  )
);

-- Members can send messages
CREATE POLICY "Members can send messages"
ON public.group_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_members.group_id = group_messages.group_id
    AND group_chat_members.user_id = auth.uid()
  )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.group_messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Enable realtime for group_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Trigger for updating group_chats.updated_at
CREATE TRIGGER update_group_chats_updated_at
BEFORE UPDATE ON public.group_chats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();