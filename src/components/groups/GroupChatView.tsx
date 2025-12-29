import { useState, useRef, useEffect } from 'react';
import { useGroupChat } from '@/hooks/useGroupChats';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ArrowLeft, Send, Users, UserPlus, Crown, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { InviteMemberDialog } from './InviteMemberDialog';
import { useGroupChats } from '@/hooks/useGroupChats';
import { Skeleton } from '@/components/ui/skeleton';

interface GroupChatViewProps {
  groupId: string;
  onBack: () => void;
}

export const GroupChatView = ({ groupId, onBack }: GroupChatViewProps) => {
  const { user } = useAuth();
  const { group, members, messages, isLoading, isAdmin, sendMessage, removeMember } = useGroupChat(groupId);
  const { inviteMember } = useGroupChats();
  const [messageInput, setMessageInput] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-card/50">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{group.name}</h2>
          <p className="text-xs text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Users className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-border">
            <SheetHeader>
              <SheetTitle>Group Members</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  className="w-full mb-4"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              )}
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {member.profile?.full_name?.[0] || member.profile?.email?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {member.profile?.full_name || member.profile?.email || 'Unknown'}
                      {member.user_id === user?.id && (
                        <span className="text-muted-foreground ml-1">(you)</span>
                      )}
                    </p>
                    {member.profile?.username && (
                      <p className="text-xs text-muted-foreground">@{member.profile.username}</p>
                    )}
                  </div>
                  {member.role === 'admin' && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                  {isAdmin && member.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeMember(member.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {message.sender?.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    } rounded-2xl px-4 py-2`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {message.sender?.full_name || message.sender?.username || 'Unknown'}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="bg-secondary border-border"
          />
          <Button onClick={handleSend} disabled={!messageInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Invite Dialog */}
      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        groupId={groupId}
        onInvite={inviteMember}
      />
    </div>
  );
};
