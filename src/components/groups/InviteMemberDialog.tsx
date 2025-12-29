import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onInvite: (groupId: string, identifier: string) => Promise<{ error: string | null }>;
}

export const InviteMemberDialog = ({
  open,
  onOpenChange,
  groupId,
  onInvite,
}: InviteMemberDialogProps) => {
  const [identifier, setIdentifier] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!identifier.trim()) return;

    setIsInviting(true);
    setError(null);
    
    const result = await onInvite(groupId, identifier.trim());
    
    setIsInviting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setIdentifier('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Member
          </DialogTitle>
          <DialogDescription>
            Invite someone to join this group by their username or email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Username or Email</Label>
            <Input
              id="identifier"
              placeholder="Enter username or email..."
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError(null);
              }}
              className="bg-secondary border-border"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={!identifier.trim() || isInviting}>
            {isInviting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              'Send Invite'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
