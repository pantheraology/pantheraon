import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHUNK_SIZE = 500; // tokens approx (chars / 4)
const CHUNK_OVERLAP = 50;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const charChunkSize = CHUNK_SIZE * 4;
  const charOverlap = CHUNK_OVERLAP * 4;
  
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + charChunkSize, text.length);
    
    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start + charChunkSize / 2) {
        end = breakPoint + 1;
      }
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start = end - charOverlap;
  }
  
  return chunks;
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
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
    const error = await response.text();
    console.error('Embedding API error:', error);
    throw new Error(`Failed to generate embedding: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function extractTextFromFile(bucket: string, path: string, supabase: any): Promise<string> {
  // Download file from storage
  const { data, error } = await supabase.storage.from(bucket).download(path);
  
  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  const fileType = path.split('.').pop()?.toLowerCase();
  
  if (fileType === 'txt' || fileType === 'md') {
    return await data.text();
  }
  
  if (fileType === 'pdf') {
    // For PDF, we'll extract basic text (in production, use a PDF parser)
    // This is a simplified approach - real implementation would use pdf.js or similar
    const text = await data.text();
    // Filter out binary content and extract readable text
    const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    return cleanText;
  }
  
  if (fileType === 'json') {
    const json = await data.json();
    return JSON.stringify(json, null, 2);
  }

  // Default: try to read as text
  return await data.text();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const userSupabase = createClient(supabaseUrl, authHeader.replace('Bearer ', ''));
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { knowledgeId, agentId } = await req.json();

    if (!knowledgeId || !agentId) {
      return new Response(JSON.stringify({ error: 'Missing knowledgeId or agentId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing knowledge ${knowledgeId} for agent ${agentId}`);

    // Update status to processing
    await supabase
      .from('agent_knowledge')
      .update({ processing_status: 'processing' })
      .eq('id', knowledgeId);

    // Get knowledge file info
    const { data: knowledge, error: knowledgeError } = await supabase
      .from('agent_knowledge')
      .select('*')
      .eq('id', knowledgeId)
      .single();

    if (knowledgeError || !knowledge) {
      throw new Error(`Knowledge not found: ${knowledgeError?.message}`);
    }

    // Extract text from file
    console.log(`Extracting text from ${knowledge.file_path}`);
    const text = await extractTextFromFile('agent-knowledge', knowledge.file_path, supabase);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text content extracted from file');
    }

    console.log(`Extracted ${text.length} characters`);

    // Chunk the text
    const chunks = chunkText(text);
    console.log(`Created ${chunks.length} chunks`);

    // Delete existing embeddings for this knowledge
    await supabase
      .from('agent_embeddings')
      .delete()
      .eq('knowledge_id', knowledgeId);

    // Generate embeddings and store
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      
      try {
        const embedding = await generateEmbedding(chunk, lovableApiKey);
        
        const { error: insertError } = await supabase
          .from('agent_embeddings')
          .insert({
            agent_id: agentId,
            knowledge_id: knowledgeId,
            chunk_text: chunk,
            chunk_index: i,
            embedding: embedding,
          });

        if (insertError) {
          console.error(`Failed to insert embedding ${i}:`, insertError);
        }
      } catch (embError) {
        console.error(`Failed to generate embedding for chunk ${i}:`, embError);
      }
    }

    // Update status to completed
    await supabase
      .from('agent_knowledge')
      .update({ processing_status: 'completed' })
      .eq('id', knowledgeId);

    console.log(`Successfully processed knowledge ${knowledgeId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      chunksProcessed: chunks.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing knowledge:', error);
    
    // Try to update status to failed
    try {
      const { knowledgeId } = await req.clone().json();
      if (knowledgeId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('agent_knowledge')
          .update({ 
            processing_status: 'failed',
            processing_error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', knowledgeId);
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
