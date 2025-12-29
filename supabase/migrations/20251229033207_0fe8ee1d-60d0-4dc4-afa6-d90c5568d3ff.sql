-- Create agents table
CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  instructions text,
  is_main boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_is_main ON public.agents(is_main) WHERE is_main = true;

-- Agent conversation starters
CREATE TABLE public.agent_conversation_starters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  display_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.agent_conversation_starters ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_agent_starters_agent_id ON public.agent_conversation_starters(agent_id);

-- Agent models (which AI models the agent can use)
CREATE TABLE public.agent_models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  model_id text NOT NULL,
  UNIQUE(agent_id, model_id)
);

ALTER TABLE public.agent_models ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_agent_models_agent_id ON public.agent_models(agent_id);

-- Agent capabilities (web search, thinking, code, image gen, etc.)
CREATE TABLE public.agent_capabilities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  capability text NOT NULL,
  UNIQUE(agent_id, capability)
);

ALTER TABLE public.agent_capabilities ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_agent_capabilities_agent_id ON public.agent_capabilities(agent_id);

-- Agent knowledge (file references stored in storage)
CREATE TABLE public.agent_knowledge (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  file_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_knowledge ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_agent_knowledge_agent_id ON public.agent_knowledge(agent_id);

-- Agent actions (external service connections)
CREATE TABLE public.agent_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_name text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_agent_actions_agent_id ON public.agent_actions(agent_id);

-- RLS Policies for agents
CREATE POLICY "Users can view their own agents"
ON public.agents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agents"
ON public.agents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
ON public.agents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
ON public.agents FOR DELETE
USING (auth.uid() = user_id);

-- Helper function to check agent ownership
CREATE OR REPLACE FUNCTION public.owns_agent(agent_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agents
    WHERE id = agent_uuid AND user_id = auth.uid()
  )
$$;

-- RLS Policies for agent_conversation_starters
CREATE POLICY "Users can manage their agent starters"
ON public.agent_conversation_starters FOR ALL
USING (public.owns_agent(agent_id))
WITH CHECK (public.owns_agent(agent_id));

-- RLS Policies for agent_models
CREATE POLICY "Users can manage their agent models"
ON public.agent_models FOR ALL
USING (public.owns_agent(agent_id))
WITH CHECK (public.owns_agent(agent_id));

-- RLS Policies for agent_capabilities
CREATE POLICY "Users can manage their agent capabilities"
ON public.agent_capabilities FOR ALL
USING (public.owns_agent(agent_id))
WITH CHECK (public.owns_agent(agent_id));

-- RLS Policies for agent_knowledge
CREATE POLICY "Users can manage their agent knowledge"
ON public.agent_knowledge FOR ALL
USING (public.owns_agent(agent_id))
WITH CHECK (public.owns_agent(agent_id));

-- RLS Policies for agent_actions
CREATE POLICY "Users can manage their agent actions"
ON public.agent_actions FOR ALL
USING (public.owns_agent(agent_id))
WITH CHECK (public.owns_agent(agent_id));

-- Trigger for updating agents.updated_at
CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for agent knowledge files
INSERT INTO storage.buckets (id, name, public) VALUES ('agent-knowledge', 'agent-knowledge', false);

-- Storage policies for agent knowledge
CREATE POLICY "Users can upload agent knowledge files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agent-knowledge' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their agent knowledge files"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-knowledge' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their agent knowledge files"
ON storage.objects FOR DELETE
USING (bucket_id = 'agent-knowledge' AND auth.uid()::text = (storage.foldername(name))[1]);