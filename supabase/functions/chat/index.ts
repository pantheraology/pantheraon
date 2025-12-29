import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Message validation
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function validateMessages(data: unknown): { valid: boolean; messages?: ChatMessage[]; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const body = data as Record<string, unknown>;
  
  if (!Array.isArray(body.messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }

  if (body.messages.length === 0) {
    return { valid: false, error: 'Messages array cannot be empty' };
  }

  if (body.messages.length > 50) {
    return { valid: false, error: 'Too many messages (max 50)' };
  }

  const validRoles = ['user', 'assistant', 'system'];
  const validatedMessages: ChatMessage[] = [];

  for (let i = 0; i < body.messages.length; i++) {
    const msg = body.messages[i];
    
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: `Message at index ${i} is invalid` };
    }

    const message = msg as Record<string, unknown>;

    if (typeof message.role !== 'string' || !validRoles.includes(message.role)) {
      return { valid: false, error: `Invalid role at index ${i}. Must be 'user', 'assistant', or 'system'` };
    }

    if (typeof message.content !== 'string') {
      return { valid: false, error: `Content at index ${i} must be a string` };
    }

    if (message.content.length === 0) {
      return { valid: false, error: `Content at index ${i} cannot be empty` };
    }

    if (message.content.length > 10000) {
      return { valid: false, error: `Content at index ${i} exceeds maximum length (10000 characters)` };
    }

    validatedMessages.push({
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content,
    });
  }

  return { valid: true, messages: validatedMessages };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with the request's auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message || "No user found");
      return new Response(JSON.stringify({ error: 'Unauthorized. Please sign in to use the chat.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Authenticated user:", user.id);

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate messages
    const validation = validateMessages(requestBody);
    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messages = validation.messages!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Starting chat request for user", user.id, "with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are Ombrion AI, an intelligent and helpful assistant. You provide clear, accurate, and thoughtful responses to user questions. 

Key traits:
- Be conversational and friendly, but professional
- Provide detailed answers when needed, but be concise when appropriate
- Use markdown formatting for better readability when it helps
- If you don't know something, be honest about it
- Be helpful with a wide range of topics including research, current events, health, parenting, sports, and more`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway for user", user.id);

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
