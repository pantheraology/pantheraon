// Public config endpoint for the frontend (safe for publishable keys)
// Exposes Clerk publishable key so the app can boot even if Vite env isn't hydrated.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clerkPublishableKey = Deno.env.get("VITE_CLERK_PUBLISHABLE_KEY") ?? "";

  return new Response(JSON.stringify({ clerkPublishableKey }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
