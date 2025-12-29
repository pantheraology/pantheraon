import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Message validation
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
}

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface UploadedFile {
  url: string;
  type: 'image' | 'document';
  name: string;
  mimeType: string;
}

type ChatMode = 'normal' | 'research' | 'thinking';

interface RequestBody {
  messages: ChatMessage[];
  mode?: ChatMode;
  model?: string;
  agentId?: string;
  attachments?: UploadedFile[];
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
      attachments: requestBody.attachments as UploadedFile[] | undefined,
    } 
  };
}

function getSystemPrompt(mode: ChatMode, agentInstructions?: string, knowledgeContext?: string): string {
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

  // Add knowledge context if available (RAG)
  if (knowledgeContext) {
    basePrompt = `${basePrompt}\n\n## Relevant Knowledge Base Context:\n${knowledgeContext}\n\nUse the above knowledge context to inform your responses when relevant.`;
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

// Generate embedding for RAG query
async function generateQueryEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      console.error('Embedding API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

// Retrieve relevant knowledge chunks using vector similarity
async function retrieveKnowledgeContext(
  agentId: string,
  query: string,
  supabaseClient: any,
  lovableApiKey: string
): Promise<string | null> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query, lovableApiKey);
    if (!queryEmbedding) return null;

    // Query for similar chunks using RPC (assuming a match function exists)
    // For now, we'll do a simple fetch and filter (less optimal but works without custom RPC)
    const { data: chunks, error } = await supabaseClient
      .from('agent_embeddings')
      .select('chunk_text, embedding')
      .eq('agent_id', agentId)
      .limit(20);

    if (error || !chunks || chunks.length === 0) {
      console.log('No knowledge chunks found for agent:', agentId);
      return null;
    }

    // Calculate cosine similarity manually
    const scoredChunks = chunks.map((chunk: any) => {
      const embedding = chunk.embedding;
      if (!embedding || !Array.isArray(embedding)) return { ...chunk, score: 0 };
      
      // Cosine similarity
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      for (let i = 0; i < queryEmbedding.length; i++) {
        dotProduct += queryEmbedding[i] * (embedding[i] || 0);
        normA += queryEmbedding[i] * queryEmbedding[i];
        normB += (embedding[i] || 0) * (embedding[i] || 0);
      }
      
      const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      return { ...chunk, score };
    });

    // Sort by score and take top 5
    scoredChunks.sort((a: any, b: any) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 5).filter((c: any) => c.score > 0.3);

    if (topChunks.length === 0) return null;

    // Combine chunks into context
    const context = topChunks.map((c: any) => c.chunk_text).join('\n\n---\n\n');
    console.log(`Retrieved ${topChunks.length} knowledge chunks for agent ${agentId}`);
    
    return context;
  } catch (error) {
    console.error('Error retrieving knowledge context:', error);
    return null;
  }
}

// Build multimodal message content for vision models
function buildMultimodalContent(textContent: string, attachments?: UploadedFile[]): string | MessageContent[] {
  if (!attachments || attachments.length === 0) {
    return textContent;
  }

  const imageAttachments = attachments.filter(a => a.type === 'image');
  if (imageAttachments.length === 0) {
    return textContent;
  }

  // Build multimodal content array
  const content: MessageContent[] = [
    { type: 'text', text: textContent }
  ];

  for (const img of imageAttachments) {
    content.push({
      type: 'image_url',
      image_url: { url: img.url }
    });
  }

  return content;
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

    // Also create admin client for RAG queries
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    const { messages, mode, model: requestedModel, agentId, attachments } = validation.body!;
    const finalModel = getModelForMode(requestedModel!, mode!);

    // Fetch agent instructions if agentId is provided
    let agentInstructions: string | undefined;
    let knowledgeContext: string | undefined;
    
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
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

      // Retrieve RAG context from agent knowledge
      if (lovableApiKey && messages.length > 0) {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage && typeof lastUserMessage.content === 'string') {
          const ragContext = await retrieveKnowledgeContext(
            agentId,
            lastUserMessage.content,
            supabaseAdmin,
            lovableApiKey
          );
          if (ragContext) knowledgeContext = ragContext;
        }
      }
    }

    const systemPrompt = getSystemPrompt(mode!, agentInstructions, knowledgeContext);
    
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

    console.log(`Chat request: user=${user.id}, mode=${mode}, model=${finalModel}, byok=${!!userKey}, messages=${messages.length}, agentId=${agentId || 'none'}, attachments=${attachments?.length || 0}, hasRAG=${!!knowledgeContext}`);

    // Prepare messages with multimodal content if attachments present
    const lastMessageIndex = messages.length - 1;
    const processedMessages = messages.map((m, i) => {
      if (i === lastMessageIndex && m.role === 'user' && attachments && attachments.length > 0) {
        return {
          role: m.role,
          content: buildMultimodalContent(m.content as string, attachments),
        };
      }
      return m;
    });

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
              ...processedMessages,
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
        
        // Build Google AI format messages
        const googleMessages = processedMessages.map(m => {
          if (Array.isArray(m.content)) {
            // Multimodal message
            return {
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: (m.content as MessageContent[]).map(part => {
                if (part.type === 'text') {
                  return { text: part.text };
                } else if (part.type === 'image_url') {
                  return { 
                    inlineData: { 
                      mimeType: 'image/jpeg',
                      data: part.image_url?.url || ''
                    }
                  };
                }
                return { text: '' };
              })
            };
          }
          return {
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content as string }]
          };
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:streamGenerateContent?key=${userKey.api_key}&alt=sse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              ...googleMessages
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
        
        // Convert to Anthropic format (handle multimodal)
        const anthropicMessages = processedMessages.map(m => {
          if (Array.isArray(m.content)) {
            // Multimodal message - convert to Anthropic format
            return {
              role: m.role,
              content: (m.content as MessageContent[]).map(part => {
                if (part.type === 'text') {
                  return { type: 'text', text: part.text };
                } else if (part.type === 'image_url') {
                  return {
                    type: 'image',
                    source: {
                      type: 'url',
                      url: part.image_url?.url || ''
                    }
                  };
                }
                return { type: 'text', text: '' };
              })
            };
          }
          return {
            role: m.role,
            content: m.content as string,
          };
        });

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
            messages: anthropicMessages,
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
          ...processedMessages,
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
