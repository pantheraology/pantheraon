-- Add unique constraint to prevent duplicate API keys per user/provider
ALTER TABLE user_api_keys 
ADD CONSTRAINT user_api_keys_user_provider_unique 
UNIQUE (user_id, provider);