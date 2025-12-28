import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Settings, Archive, LogOut } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const UserAccountMenu = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  if (!user) return null;

  const displayName = user.firstName || user.username || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSignOut = () => {
    signOut(() => navigate('/'));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/30 transition-colors w-full text-left">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.imageUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-foreground text-sm font-medium">{displayName}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="start" 
        className="w-48 p-1.5 bg-popover border-border"
      >
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted/50 transition-colors w-full text-left"
          >
            <Settings size={16} className="text-muted-foreground" />
            Settings
          </button>
          <button
            onClick={() => navigate('/archived')}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted/50 transition-colors w-full text-left"
          >
            <Archive size={16} className="text-muted-foreground" />
            Archived Chats
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted/50 transition-colors w-full text-left"
          >
            <LogOut size={16} className="text-muted-foreground" />
            Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
