import { Users, MoreVertical, LogOut, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GroupChatWithMembers } from '@/types/groupChat';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface GroupChatCardProps {
  group: GroupChatWithMembers;
  onClick: () => void;
  onLeave: () => void;
  onDelete: () => void;
}

export const GroupChatCard = ({
  group,
  onClick,
  onLeave,
  onDelete,
}: GroupChatCardProps) => {
  const { user } = useAuth();
  const isCreator = user?.id === group.created_by;

  return (
    <Card
      className="group cursor-pointer bg-card/50 hover:bg-card border-border/50 hover:border-primary/30 transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">
                  {group.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {group.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Updated {formatDistanceToNow(new Date(group.updated_at), { addSuffix: true })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onLeave();
                }}
                className="text-muted-foreground focus:text-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave Group
              </DropdownMenuItem>
              {isCreator && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Group
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
