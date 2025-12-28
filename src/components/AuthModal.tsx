import { Link } from 'react-router-dom';
import { X, LogIn, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const AuthModal = ({ isOpen, onClose, message }: AuthModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-strong border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">
            Welcome to PantheraON
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {message || 'Sign in to unlock all features and save your conversations.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Link
            to="/sign-up"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-gradient-to-b from-primary to-primary/60 text-primary-foreground font-medium hover:brightness-110 transition-all"
          >
            <UserPlus size={18} />
            Create Account
          </Link>

          <Link
            to="/sign-in"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-muted/50 border border-border text-foreground font-medium hover:bg-muted transition-all"
          >
            <LogIn size={18} />
            Sign In
          </Link>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </DialogContent>
    </Dialog>
  );
};
