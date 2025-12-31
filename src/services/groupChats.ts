/**
 * Group Chats Service
 * Encapsulates all Supabase operations for group chats
 */

import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { GroupChat, GroupChatWithMembers, GroupChatMember, GroupMessage } from '@/types/groupChat';

type DbGroupChat = Tables<'group_chats'>;
type DbGroupMember = Tables<'group_chat_members'>;
type DbGroupMessage = Tables<'group_messages'>;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Transform DB group to app group
const toGroupChat = (dbGroup: DbGroupChat): GroupChat => ({
  id: dbGroup.id,
  name: dbGroup.name,
  description: dbGroup.description,
  created_by: dbGroup.created_by,
  created_at: dbGroup.created_at,
  updated_at: dbGroup.updated_at,
});

/**
 * Fetch group IDs that a user is a member of
 */
export async function fetchUserGroupIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('group_chat_members')
    .select('group_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map(m => m.group_id);
}

/**
 * Fetch paginated group chats for a user
 */
export async function fetchGroupChats(
  userId: string,
  params: PaginationParams
): Promise<{ data: GroupChatWithMembers[]; hasMore: boolean }> {
  const { page, pageSize } = params;
  
  // Get groups user is a member of
  const groupIds = await fetchUserGroupIds(userId);
  
  if (groupIds.length === 0) {
    return { data: [], hasMore: false };
  }

  const from = page * pageSize;
  const to = (page + 1) * pageSize - 1;

  const { data: groups, error } = await supabase
    .from('group_chats')
    .select('*')
    .in('id', groupIds)
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const groupsList = groups || [];
  
  // Fetch member counts
  const groupsWithMembers: GroupChatWithMembers[] = await Promise.all(
    groupsList.map(async (group) => {
      const { count } = await supabase
        .from('group_chat_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      return {
        ...toGroupChat(group),
        members: [],
        member_count: count || 0,
      };
    })
  );

  return {
    data: groupsWithMembers,
    hasMore: groupsList.length === pageSize,
  };
}

/**
 * Create a new group chat
 */
export async function createGroupChat(
  userId: string,
  name: string,
  description?: string
): Promise<GroupChat> {
  const { data: group, error: groupError } = await supabase
    .from('group_chats')
    .insert({
      name,
      description,
      created_by: userId,
    })
    .select()
    .single();

  if (groupError) throw groupError;

  // Add creator as admin
  const { error: memberError } = await supabase
    .from('group_chat_members')
    .insert({
      group_id: group.id,
      user_id: userId,
      role: 'admin',
    });

  if (memberError) throw memberError;

  return toGroupChat(group);
}

/**
 * Delete a group chat
 */
export async function deleteGroupChat(groupId: string): Promise<void> {
  const { error } = await supabase
    .from('group_chats')
    .delete()
    .eq('id', groupId);

  if (error) throw error;
}

/**
 * Leave a group chat
 */
export async function leaveGroupChat(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('group_chat_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Invite a member to a group chat
 */
export async function inviteMember(
  groupId: string,
  username: string
): Promise<{ userId: string } | null> {
  // Find user by username
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .maybeSingle();

  if (userError) throw userError;
  if (!user) return null;

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_chat_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    throw new Error('User is already a member of this group');
  }

  // Add as member
  const { error: addError } = await supabase
    .from('group_chat_members')
    .insert({
      group_id: groupId,
      user_id: user.id,
      role: 'member',
    });

  if (addError) throw addError;

  return { userId: user.id };
}

/**
 * Remove a member from a group chat
 */
export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('group_chat_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}

/**
 * Fetch a single group with members and messages
 */
export async function fetchGroupDetails(
  groupId: string
): Promise<{ group: GroupChat; members: GroupChatMember[]; isAdmin: boolean } | null> {
  const { data: groupData, error: groupError } = await supabase
    .from('group_chats')
    .select('*')
    .eq('id', groupId)
    .single();

  if (groupError) return null;

  const { data: membersData, error: membersError } = await supabase
    .from('group_chat_members')
    .select('*')
    .eq('group_id', groupId);

  if (membersError) throw membersError;

  // Fetch profiles for members
  const memberUserIds = (membersData || []).map(m => m.user_id);
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, username')
    .in('id', memberUserIds);

  const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

  const members: GroupChatMember[] = (membersData || []).map(m => ({
    ...m,
    role: m.role as 'admin' | 'member',
    profile: profilesMap.get(m.user_id) || undefined,
  }));

  const { data: { user } } = await supabase.auth.getUser();
  const currentMember = members.find(m => m.user_id === user?.id);
  const isAdmin = currentMember?.role === 'admin';

  return {
    group: toGroupChat(groupData),
    members,
    isAdmin,
  };
}

/**
 * Fetch messages for a group
 */
export async function fetchGroupMessages(groupId: string): Promise<GroupMessage[]> {
  const { data: messagesData, error } = await supabase
    .from('group_messages')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Fetch sender profiles
  const senderIds = [...new Set((messagesData || []).map(m => m.sender_id))];
  const { data: sendersData } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, username')
    .in('id', senderIds);

  const sendersMap = new Map((sendersData || []).map(s => [s.id, s]));

  return (messagesData || []).map(m => ({
    ...m,
    sender: sendersMap.get(m.sender_id) || undefined,
  }));
}

/**
 * Send a message to a group
 */
export async function sendGroupMessage(
  groupId: string,
  senderId: string,
  content: string
): Promise<void> {
  const { error } = await supabase
    .from('group_messages')
    .insert({
      group_id: groupId,
      sender_id: senderId,
      content: content.trim(),
    });

  if (error) throw error;
}
