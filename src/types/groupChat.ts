export interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupChatMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  // Joined profile data
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    username: string | null;
  };
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // Joined profile data
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export interface GroupChatWithMembers extends GroupChat {
  members: GroupChatMember[];
  member_count: number;
}
