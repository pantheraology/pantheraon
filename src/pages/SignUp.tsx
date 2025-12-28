import { SignUp as ClerkSignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SignUp = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          Back to home
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-primary/80 via-primary to-primary/60 shadow-[0_0_38px_hsl(var(--primary)/0.45)] flex items-center justify-center text-foreground font-bold text-xl mx-auto mb-4">
            P
          </div>
          <h1 className="text-3xl font-light text-foreground mb-2">Create account</h1>
          <p className="text-muted-foreground">Join PantheraON and start exploring</p>
        </div>

        <div className="flex justify-center">
          <ClerkSignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-muted/50 border border-border hover:bg-muted',
                formFieldInput: 'bg-input border-border focus:ring-primary',
                formButtonPrimary: 'bg-gradient-to-b from-primary to-primary/60 hover:brightness-110',
                footerActionLink: 'text-primary hover:text-primary/80',
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
