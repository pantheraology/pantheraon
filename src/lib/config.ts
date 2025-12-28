import { getSupabaseUrl, getSupabaseKey, getPublicConfigUrl, hasSupabaseConfig } from './api';

// Resolves Clerk publishable key from env or backend
export async function resolveClerkPublishableKey(): Promise<string | null> {
  // Prefer Vite env if available
  const fromEnv = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;

  // Fallback: load from backend function (publishable key is safe to expose)
  if (!hasSupabaseConfig()) return null;

  try {
    const res = await fetch(getPublicConfigUrl(), {
      method: 'GET',
      headers: {
        apikey: getSupabaseKey(),
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { clerkPublishableKey?: string };
    const key = data?.clerkPublishableKey?.trim();
    return key || null;
  } catch {
    return null;
  }
}
