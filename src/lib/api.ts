// Centralized API configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const getSupabaseUrl = () => SUPABASE_URL;
export const getSupabaseKey = () => SUPABASE_KEY;

export const getChatUrl = () => `${SUPABASE_URL}/functions/v1/chat`;
export const getPublicConfigUrl = () => `${SUPABASE_URL}/functions/v1/public-config`;

export const hasSupabaseConfig = () => Boolean(SUPABASE_URL && SUPABASE_KEY);
