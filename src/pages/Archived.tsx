import { useState, useMemo } from 'react';
import { Trash2, RotateCcw, Search, MessageSquare } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useConversations } from '@/hooks/useConversations';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useDebounce } from '@/hooks/useDebounce';
import { AuthPrompt } from '@/components/common/AuthPrompt';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

const Archived = () => {
  const { deletedConversations, isLoading, restoreConversation, permanentlyDeleteConversation } = useConversations();
  const { isSignedIn, isLoaded } = useAuthGuard();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredConversations = useMemo(() => 
    deletedConversations.filter(c =>
      c.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      c.messages.some(m => m.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
    ),
    [deletedConversations, debouncedSearchQuery]
  );

  if (isLoaded && !isSignedIn) {
    return (
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-light text-foreground mb-2">Trash</h1>
          <p className="text-muted-foreground">Your deleted conversations</p>
        </div>
        <AuthPrompt
          title="Sign in to see your trash"
          description="Deleted conversations will be saved here for 30 days"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-light text-foreground mb-2">Trash</h1>
        <p className="text-muted-foreground">Deleted conversations can be restored or permanently deleted</p>
      </div>

      {/* Search */}
      {deletedConversations.length > 0 && (
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deleted chats..."
            className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      {/* Deleted Conversations List */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-xl p-4 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            icon={Trash2}
            title={searchQuery ? 'No matching deleted chats' : 'Trash is empty'}
            description={
              searchQuery
                ? 'Try a different search term'
                : 'Deleted chats will appear here'
            }
          />
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="glass rounded-xl p-4 border border-border hover:border-border/80 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={18} className="text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{conversation.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {conversation.messages[conversation.messages.length - 1]?.content || 'No messages'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Deleted {conversation.deletedAt && formatDistanceToNow(conversation.deletedAt, { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreConversation(conversation.id)}
                    className="gap-1.5"
                  >
                    <RotateCcw size={14} />
                    Restore
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1.5">
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Permanently delete chat?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This chat and all its messages will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => permanentlyDeleteConversation(conversation.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Forever
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
};

export default Archived;
