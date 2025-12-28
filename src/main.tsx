import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useState } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import App from "./App.tsx";
import "./index.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function resolveClerkPublishableKey(): Promise<string | null> {
  // Prefer Vite env if available
  const fromEnv = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;

  // Fallback: load from backend function (publishable key is safe to expose)
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/public-config`, {
    method: "GET",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { clerkPublishableKey?: string };
  const key = data?.clerkPublishableKey?.trim();
  return key ? key : null;
}

function Bootstrap() {
  const [clerkKey, setClerkKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    resolveClerkPublishableKey()
      .then((key) => {
        if (!alive) return;
        if (!key) {
          setError("Missing VITE_CLERK_PUBLISHABLE_KEY");
          return;
        }
        setClerkKey(key);
      })
      .catch(() => {
        if (!alive) return;
        setError("Failed to load Clerk configuration");
      });
    return () => {
      alive = false;
    };
  }, []);

  const appearance = useMemo(
    () => ({
      baseTheme: dark,
      variables: {
        colorPrimary: "hsl(220, 90%, 50%)",
        colorBackground: "hsl(225, 50%, 8%)",
        colorInputBackground: "hsl(225, 20%, 15%)",
        colorInputText: "hsl(210, 40%, 98%)",
      },
    }),
    []
  );

  if (error) {
    return (
      <div className="min-h-dvh grid place-items-center bg-background text-foreground p-6">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-semibold">PantheraON</h1>
          <p className="text-sm text-muted-foreground">
            {error}. Please refresh in a few seconds.
          </p>
        </div>
      </div>
    );
  }

  if (!clerkKey) {
    return (
      <div className="min-h-dvh grid place-items-center bg-background text-foreground p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkKey} appearance={appearance} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")!).render(<Bootstrap />);
