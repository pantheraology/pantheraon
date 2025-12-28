import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthPromptProps {
  title: string;
  description: string;
  actionLabel?: string;
}

export const AuthPrompt = ({
  title,
  description,
  actionLabel = 'Sign In',
}: AuthPromptProps) => {
  return (
    <div className="glass rounded-xl p-12 text-center">
      <LogIn size={48} className="mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Link
        to="/sign-in"
        className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all"
      >
        {actionLabel}
      </Link>
    </div>
  );
};
