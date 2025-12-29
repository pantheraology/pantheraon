/**
 * Conversations Service
 * Encapsulates all Supabase operations for conversations and messages
 */

import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { Message, Conversation } from '@/types';

// Use Supabase generated types
type DbConversation = Tables<'conversations'>;
type DbMessage = Tables<'messages'>;
type ConversationInsert = TablesInsert<'conversations'>;
type MessageInsert = TablesInsert<'messages'>;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Transform DB conversation to app conversation
const toConversation = (
  dbConv: DbConversation,
  messages: Message[] = []
): Conversation => ({
  id: dbConv.id,
  title: dbConv.title,
  messages,
  createdAt: new Date(dbConv.created_at!),
  updatedAt: new Date(dbConv.updated_at!),
  spaceId: dbConv.space_id,
  deletedAt: dbConv.deleted_at ? new Date(dbConv.deleted_at) : null,
});

// Transform DB message to app message
const toMessage = (dbMsg: DbMessage): Message => ({
  id: dbMsg.id,
  role: dbMsg.role as 'user' | 'assistant',
  content: dbMsg.content,
  timestamp: new Date(dbMsg.created_at!),
});

/**
 * Fetch paginated conversations with their messages
 */
export async function fetchConversations(
  params: PaginationParams
): Promise<{ data: Conversation[]; hasMore: boolean }> {
  const { page, pageSize } = params;
  const from = page * pageSize;
  const to = (page + 1) * pageSize - 1;

  const { data: convData, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (convError) throw convError;

  const conversations = convData || [];
  const hasMore = conversations.length === pageSize;

  // Fetch messages for all conversations
  const conversationIds = conversations.map((c) => c.id);
  let messagesMap: Record<string, Message[]> = {};

  if (conversationIds.length > 0) {
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    // Group messages by conversation
    (msgData || []).forEach((m) => {
      if (!messagesMap[m.conversation_id]) {
        messagesMap[m.conversation_id] = [];
      }
      messagesMap[m.conversation_id].push(toMessage(m));
    });
  }

  return {
    data: conversations.map((c) => toConversation(c, messagesMap[c.id] || [])),
    hasMore,
  };
}

/**
 * Create a new conversation with messages
 */
export async function createConversation(
  userId: string,
  title: string,
  messages: Message[]
): Promise<Conversation> {
  const { data: convData, error: convError } = await supabase
    .from('conversations')
    .insert({ title, user_id: userId } as ConversationInsert)
    .select()
    .single();

  if (convError) throw convError;

  // Insert messages
  if (messages.length > 0) {
    const { error: msgError } = await supabase
      .from('messages')
      .insert(
        messages.map((m) => ({
          id: m.id,
          conversation_id: convData.id,
          role: m.role,
          content: m.content,
          created_at: m.timestamp?.toISOString() || new Date().toISOString(),
        } as MessageInsert))
      );

    if (msgError) throw msgError;
  }

  return toConversation(convData, messages);
}

/**
 * Update an existing conversation
 */
export async function updateConversation(
  id: string,
  title: string,
  newMessages: Message[]
): Promise<void> {
  const { error: convError } = await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (convError) throw convError;

  // Get existing message IDs
  const { data: existingMessages } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', id);

  const existingIds = new Set((existingMessages || []).map((m) => m.id));

  // Insert only new messages
  const messagesToInsert = newMessages.filter((m) => !existingIds.has(m.id));

  if (messagesToInsert.length > 0) {
    const { error: msgError } = await supabase
      .from('messages')
      .insert(
        messagesToInsert.map((m) => ({
          id: m.id,
          conversation_id: id,
          role: m.role,
          content: m.content,
          created_at: m.timestamp?.toISOString() || new Date().toISOString(),
        } as MessageInsert))
      );

    if (msgError) throw msgError;
  }
}

/**
 * Soft delete a conversation (move to trash)
 */
export async function softDeleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Restore a conversation from trash
 */
export async function restoreConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Permanently delete a conversation
 */
export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Move a conversation to a space
 */
export async function moveConversationToSpace(
  conversationId: string,
  spaceId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ space_id: spaceId })
    .eq('id', conversationId);

  if (error) throw error;
}

/**
 * Helper to truncate title with ellipsis
 */
export const truncateTitle = (content: string, maxLength: number = 50): string => {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength - 1) + '…';
};
