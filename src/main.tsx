import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import App from "./App.tsx";
import "./index.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider
    publishableKey={CLERK_PUBLISHABLE_KEY}
    appearance={{
      baseTheme: dark,
      variables: {
        colorPrimary: "hsl(220, 90%, 50%)",
        colorBackground: "hsl(225, 50%, 8%)",
        colorInputBackground: "hsl(225, 20%, 15%)",
        colorInputText: "hsl(210, 40%, 98%)",
      },
    }}
    afterSignOutUrl="/"
  >
    <App />
  </ClerkProvider>
);
