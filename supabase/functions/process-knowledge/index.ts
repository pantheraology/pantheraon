import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security: File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['txt', 'md', 'pdf', 'json'];
const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/json',
];

const CHUNK_SIZE = 500; // tokens approx (chars / 4)
const CHUNK_OVERLAP = 50;

// Magic byte signatures for file type validation
const FILE_SIGNATURES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  // JSON and text files don't have reliable magic bytes - validate content instead
};

function validateFileExtension(fileName: string): { valid: boolean; extension: string } {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return {
    valid: ALLOWED_EXTENSIONS.includes(extension),
    extension,
  };
}

function validateMagicBytes(data: Uint8Array, expectedType: string): boolean {
  const signature = FILE_SIGNATURES[expectedType];
  if (!signature) {
    // No signature to check (text/json files)
    return true;
  }
  
  if (data.length < signature.length) {
    return false;
  }
  
  return signature.every((byte, index) => data[index] === byte);
}

function validateJsonContent(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

function validateTextContent(text: string): boolean {
  // Check for excessive binary content (non-printable characters)
  const nonPrintableCount = (text.match(/[^\x20-\x7E\n\r\t]/g) || []).length;
  const ratio = nonPrintableCount / text.length;
  return ratio < 0.1; // Allow up to 10% non-printable chars
}

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const charChunkSize = CHUNK_SIZE * 4;
  const charOverlap = CHUNK_OVERLAP * 4;
  
  // Limit total text size to prevent memory exhaustion
  const maxTextLength = 1000000; // 1MB of text
  const processedText = text.slice(0, maxTextLength);
  
  let start = 0;
  while (start < processedText.length) {
    let end = Math.min(start + charChunkSize, processedText.length);
    
    // Try to break at sentence boundary
    if (end < processedText.length) {
      const lastPeriod = processedText.lastIndexOf('.', end);
      const lastNewline = processedText.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start + charChunkSize / 2) {
        end = breakPoint + 1;
      }
    }
    
    const chunk = processedText.slice(start, end).trim();
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

async function extractTextFromFile(
  bucket: string, 
  path: string, 
  supabase: any,
  expectedExtension: string
): Promise<string> {
  // Download file from storage
  const { data, error } = await supabase.storage.from(bucket).download(path);
  
  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  // Get file size and validate
  const arrayBuffer = await data.arrayBuffer();
  const fileSize = arrayBuffer.byteLength;
  
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`File size ${fileSize} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
  }

  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Validate magic bytes for PDF
  if (expectedExtension === 'pdf') {
    if (!validateMagicBytes(uint8Array, 'pdf')) {
      throw new Error('File content does not match PDF format');
    }
  }

  const textDecoder = new TextDecoder();
  
  if (expectedExtension === 'txt' || expectedExtension === 'md') {
    const text = textDecoder.decode(uint8Array);
    if (!validateTextContent(text)) {
      throw new Error('File contains excessive binary content - appears to be corrupted or wrong file type');
    }
    return text;
  }
  
  if (expectedExtension === 'pdf') {
    // For PDF, we'll extract basic text (in production, use a PDF parser)
    // This is a simplified approach - real implementation would use pdf.js or similar
    const text = textDecoder.decode(uint8Array);
    // Filter out binary content and extract readable text
    const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    return cleanText;
  }
  
  if (expectedExtension === 'json') {
    const text = textDecoder.decode(uint8Array);
    if (!validateJsonContent(text)) {
      throw new Error('Invalid JSON content');
    }
    // Limit JSON size to prevent memory issues during stringify
    const json = JSON.parse(text);
    return JSON.stringify(json, null, 2).slice(0, 500000); // 500KB limit for JSON output
  }

  // Default: try to read as text with validation
  const text = textDecoder.decode(uint8Array);
  if (!validateTextContent(text)) {
    throw new Error('File contains excessive binary content');
  }
  return text;
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

    // Validate file extension before processing
    const { valid: validExtension, extension } = validateFileExtension(knowledge.file_name);
    if (!validExtension) {
      throw new Error(`Unsupported file type: .${extension}. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Extract text from file with validation
    console.log(`Extracting text from ${knowledge.file_path} (type: ${extension})`);
    const text = await extractTextFromFile('agent-knowledge', knowledge.file_path, supabase, extension);
    
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
