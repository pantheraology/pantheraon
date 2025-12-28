import { dark } from '@clerk/themes';

// Clerk appearance configuration
export const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: 'hsl(220, 90%, 50%)',
    colorBackground: 'hsl(225, 50%, 8%)',
    colorInputBackground: 'hsl(225, 20%, 15%)',
    colorInputText: 'hsl(210, 40%, 98%)',
  },
} as const;
