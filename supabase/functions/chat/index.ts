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

type ChatMode = 'normal' | 'research' | 'thinking';

interface RequestBody {
  messages: ChatMessage[];
  mode?: ChatMode;
  model?: string;
  agentId?: string;
}

function validateMessages(data: unknown): { valid: boolean; body?: RequestBody; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const requestBody = data as Record<string, unknown>;
  
  if (!Array.isArray(requestBody.messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }

  if (requestBody.messages.length === 0) {
    return { valid: false, error: 'Messages array cannot be empty' };
  }

  if (requestBody.messages.length > 50) {
    return { valid: false, error: 'Too many messages (max 50)' };
  }

  const validRoles = ['user', 'assistant', 'system'];
  const validatedMessages: ChatMessage[] = [];

  for (let i = 0; i < requestBody.messages.length; i++) {
    const msg = requestBody.messages[i];
    
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

  // Validate mode
  const mode = (requestBody.mode as ChatMode) || 'normal';
  if (!['normal', 'research', 'thinking'].includes(mode)) {
    return { valid: false, error: 'Invalid mode. Must be normal, research, or thinking' };
  }

  // Validate model - include Anthropic models
  const model = (requestBody.model as string) || 'google/gemini-2.5-flash';
  const validModels = [
    'google/gemini-2.5-flash',
    'google/gemini-2.5-pro',
    'google/gemini-2.5-flash-lite',
    'openai/gpt-5',
    'openai/gpt-5-mini',
    'anthropic/claude-sonnet-4-5',
    'anthropic/claude-opus-4-5',
  ];
  if (!validModels.includes(model)) {
    return { valid: false, error: 'Invalid model' };
  }

  return { 
    valid: true, 
    body: { 
      messages: validatedMessages,
      mode,
      model,
      agentId: requestBody.agentId as string | undefined,
    } 
  };
}

function getSystemPrompt(mode: ChatMode, agentInstructions?: string): string {
  const baseName = Deno.env.get("AI_NAME") || "Ombrion";
  
  let basePrompt = `You are ${baseName}, an intelligent and helpful assistant. You provide clear, accurate, and thoughtful responses to user questions.

Key traits:
- Be conversational and friendly, but professional
- Provide detailed answers when needed, but be concise when appropriate
- Use markdown formatting for better readability when it helps
- If you don't know something, be honest about it
- Be helpful with a wide range of topics including research, current events, health, parenting, sports, and more`;

  // Prepend agent instructions if available
  if (agentInstructions) {
    basePrompt = `${agentInstructions}\n\n${basePrompt}`;
  }

  if (mode === 'research') {
    return `${basePrompt}

RESEARCH MODE ENABLED:
You are now in deep research mode. For this response:
- Provide comprehensive, well-researched information
- Include multiple perspectives and sources when relevant
- Break down complex topics into digestible sections
- Use structured formatting with headers, bullet points, and numbered lists
- Cite reasoning and explain your thought process
- Consider edge cases and nuances
- Aim for thoroughness over brevity`;
  }

  if (mode === 'thinking') {
    return `${basePrompt}

THINKING MODE ENABLED:
You are now in deep thinking mode. For this response:
- Think step by step through the problem
- Show your reasoning process explicitly
- Consider multiple approaches before settling on one
- Identify assumptions and validate them
- Break complex problems into smaller parts
- Explain the "why" behind each step
- Double-check your logic and conclusions
- Use structured reasoning (e.g., "First, let's consider...", "This leads to...", "Therefore...")`;
  }

  return basePrompt;
}

function getModelForMode(requestedModel: string, mode: ChatMode): string {
  // For research and thinking modes, prefer more capable models
  if (mode === 'research' || mode === 'thinking') {
    // If user selected a lite/fast model, upgrade for better reasoning
    if (requestedModel === 'google/gemini-2.5-flash-lite') {
      return 'google/gemini-2.5-flash';
    }
  }
  return requestedModel;
}

// Map models to their correct format for direct API calls
function getOpenAIModelName(model: string): string {
  switch (model) {
    case 'openai/gpt-5':
      return 'gpt-5-2025-08-07';
    case 'openai/gpt-5-mini':
      return 'gpt-5-mini-2025-08-07';
    default:
      return 'gpt-5-2025-08-07';
  }
}

function getGoogleModelName(model: string): string {
  switch (model) {
    case 'google/gemini-2.5-flash':
      return 'gemini-2.5-flash';
    case 'google/gemini-2.5-pro':
      return 'gemini-2.5-pro';
    case 'google/gemini-2.5-flash-lite':
      return 'gemini-2.5-flash-lite';
    default:
      return 'gemini-2.5-flash';
  }
}

function getAnthropicModelName(model: string): string {
  switch (model) {
    case 'anthropic/claude-sonnet-4-5':
      return 'claude-sonnet-4-5-20240620';
    case 'anthropic/claude-opus-4-5':
      return 'claude-opus-4-5-20251101';
    default:
      return 'claude-sonnet-4-5-20240620';
  }
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
    let requestData: unknown;
    try {
      requestData = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate messages
    const validation = validateMessages(requestData);
    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, mode, model: requestedModel, agentId } = validation.body!;
    const finalModel = getModelForMode(requestedModel!, mode!);

    // Fetch agent instructions if agentId is provided
    let agentInstructions: string | undefined;
    if (agentId) {
      const { data: agent, error: agentError } = await supabaseClient
        .from('agents')
        .select('instructions')
        .eq('id', agentId)
        .eq('user_id', user.id)
        .single();
      
      if (!agentError && agent?.instructions) {
        agentInstructions = agent.instructions;
        console.log("Using agent instructions for agent:", agentId);
      }
    }

    const systemPrompt = getSystemPrompt(mode!, agentInstructions);
    
    // Check for user's own API key (BYOK)
    const { data: userApiKeys } = await supabaseClient
      .from('user_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Determine provider
    let provider = 'lovable';
    if (finalModel.startsWith('openai/')) provider = 'openai';
    else if (finalModel.startsWith('google/')) provider = 'google';
    else if (finalModel.startsWith('anthropic/')) provider = 'anthropic';

    const userKey = userApiKeys?.find(k => k.provider === provider);

    console.log(`Chat request: user=${user.id}, mode=${mode}, model=${finalModel}, byok=${!!userKey}, messages=${messages.length}, agentId=${agentId || 'none'}`);

    // If user has their own API key for this provider, use it directly
    if (userKey) {
      console.log(`Using BYOK for provider: ${provider}`);
      
      if (provider === 'openai') {
        // Direct OpenAI API call
        const openaiModel = getOpenAIModelName(finalModel);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userKey.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
            stream: true,
            max_completion_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("OpenAI API error:", response.status, errorText);
          
          if (response.status === 401) {
            return new Response(JSON.stringify({ error: "Invalid OpenAI API key. Please check your API key in Settings." }), {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (response.status === 429) {
            return new Response(JSON.stringify({ error: "OpenAI rate limit exceeded. Please try again later." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          return new Response(JSON.stringify({ error: "Failed to get AI response from OpenAI" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(response.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      } else if (provider === 'google') {
        // Direct Google AI API call
        const googleModel = getGoogleModelName(finalModel);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:streamGenerateContent?key=${userKey.api_key}&alt=sse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              ...messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
              }))
            ],
            generationConfig: {
              maxOutputTokens: 4096,
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Google AI API error:", response.status, errorText);
          
          if (response.status === 401 || response.status === 403) {
            return new Response(JSON.stringify({ error: "Invalid Google AI API key. Please check your API key in Settings." }), {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (response.status === 429) {
            return new Response(JSON.stringify({ error: "Google AI rate limit exceeded. Please try again later." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          return new Response(JSON.stringify({ error: "Failed to get AI response from Google AI" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Transform Google's SSE format to OpenAI-compatible format for the frontend
        const transformStream = new TransformStream({
          transform(chunk, controller) {
            const text = new TextDecoder().decode(chunk);
            try {
              const lines = text.split('\n').filter(line => line.trim());
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = JSON.parse(line.slice(6));
                  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const openaiFormat = {
                      choices: [{
                        delta: { content: data.candidates[0].content.parts[0].text }
                      }]
                    };
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openaiFormat)}\n\n`));
                  }
                }
              }
            } catch (e) {
              console.error("Transform error:", e);
            }
          },
          flush(controller) {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          }
        });

        return new Response(response.body?.pipeThrough(transformStream), {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      } else if (provider === 'anthropic') {
        // Direct Anthropic API call
        const anthropicModel = getAnthropicModelName(finalModel);
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': userKey.api_key,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: anthropicModel,
            max_tokens: 4096,
            system: systemPrompt,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Anthropic API error:", response.status, errorText);
          
          if (response.status === 401) {
            return new Response(JSON.stringify({ error: "Invalid Anthropic API key. Please check your API key in Settings." }), {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (response.status === 429) {
            return new Response(JSON.stringify({ error: "Anthropic rate limit exceeded. Please try again later." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          return new Response(JSON.stringify({ error: "Failed to get AI response from Anthropic" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Transform Anthropic's SSE format to OpenAI-compatible format
        const transformStream = new TransformStream({
          transform(chunk, controller) {
            const text = new TextDecoder().decode(chunk);
            try {
              const lines = text.split('\n').filter(line => line.trim());
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'content_block_delta' && data.delta?.text) {
                    const openaiFormat = {
                      choices: [{
                        delta: { content: data.delta.text }
                      }]
                    };
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openaiFormat)}\n\n`));
                  }
                }
              }
            } catch (e) {
              console.error("Transform error:", e);
            }
          },
          flush(controller) {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          }
        });

        return new Response(response.body?.pipeThrough(transformStream), {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
    }

    // Fallback to Lovable AI gateway
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("No API key available");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: finalModel,
        messages: [
          { role: "system", content: systemPrompt },
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
