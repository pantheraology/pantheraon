import { Bot, MoreVertical, Edit, Trash2, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Agent } from '@/types/agent';
import { formatDistanceToNow } from 'date-fns';

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
  onSetMain: () => void;
  onDelete: () => void;
}

export const AgentCard = ({
  agent,
  onClick,
  onSetMain,
  onDelete,
}: AgentCardProps) => {
  return (
    <Card
      className="group cursor-pointer bg-card/50 hover:bg-card border-border/50 hover:border-primary/30 transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground truncate">
                    {agent.name}
                  </h3>
                  {agent.is_main && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Main
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            {agent.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {agent.description}
              </p>
            )}
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
                  onClick();
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Agent
              </DropdownMenuItem>
              {!agent.is_main && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetMain();
                  }}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Set as Main
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
