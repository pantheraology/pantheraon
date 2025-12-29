// Centralized API configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export const getChatUrl = () => `${SUPABASE_URL}/functions/v1/chat`;
