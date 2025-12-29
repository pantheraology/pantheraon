import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Archive, LogOut } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const UserAccountMenu = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/30 transition-colors w-full text-left">
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
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
        className="w-52 p-2 bg-[hsl(240_10%_10%)] border-border/50 rounded-xl shadow-xl"
      >
        <div className="flex flex-col">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/30 transition-colors w-full text-left"
          >
            <Settings size={16} className="text-muted-foreground" />
            Settings
          </button>
          
          <div className="h-px bg-border/50 my-1 mx-2" />
          
          <button
            onClick={() => navigate('/archived')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/30 transition-colors w-full text-left"
          >
            <Archive size={16} className="text-muted-foreground" />
            Archived Chats
          </button>
          
          <div className="h-px bg-border/50 my-1 mx-2" />
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/30 transition-colors w-full text-left"
          >
            <LogOut size={16} className="text-muted-foreground" />
            Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
