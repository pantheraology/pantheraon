import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token to get user info
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client with user's token to verify identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the user from the token
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Deleting account for user: ${userId}`);

    // Create admin client for data deletion and user removal
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data from all tables (order matters due to foreign keys)
    // 1. Delete messages (references conversations)
    const { error: messagesError } = await adminClient
      .from('messages')
      .delete()
      .eq('conversation_id', 
        adminClient.from('conversations').select('id').eq('user_id', userId)
      );
    
    // Actually, we need to get conversation IDs first
    const { data: conversations } = await adminClient
      .from('conversations')
      .select('id')
      .eq('user_id', userId);
    
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      await adminClient.from('messages').delete().in('conversation_id', conversationIds);
    }

    // 2. Delete conversations
    await adminClient.from('conversations').delete().eq('user_id', userId);

    // 3. Delete agent-related data
    const { data: agents } = await adminClient
      .from('agents')
      .select('id')
      .eq('user_id', userId);
    
    if (agents && agents.length > 0) {
      const agentIds = agents.map(a => a.id);
      await adminClient.from('agent_actions').delete().in('agent_id', agentIds);
      await adminClient.from('agent_capabilities').delete().in('agent_id', agentIds);
      await adminClient.from('agent_conversation_starters').delete().in('agent_id', agentIds);
      await adminClient.from('agent_knowledge').delete().in('agent_id', agentIds);
      await adminClient.from('agent_models').delete().in('agent_id', agentIds);
    }
    
    await adminClient.from('agents').delete().eq('user_id', userId);

    // 4. Delete group-related data
    // First, leave all groups (delete memberships)
    await adminClient.from('group_chat_members').delete().eq('user_id', userId);
    
    // Delete messages sent by user
    await adminClient.from('group_messages').delete().eq('sender_id', userId);
    
    // Delete groups created by user (cascade will handle members and messages)
    await adminClient.from('group_chats').delete().eq('created_by', userId);

    // 5. Delete spaces
    await adminClient.from('spaces').delete().eq('user_id', userId);

    // 6. Delete studio generations
    await adminClient.from('studio_generations').delete().eq('user_id', userId);

    // 7. Delete profile
    await adminClient.from('profiles').delete().eq('id', userId);

    // 8. Finally, delete the auth user
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
