import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AuthPrompt } from '@/components/common/AuthPrompt';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useGroupChats } from '@/hooks/useGroupChats';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search } from 'lucide-react';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { GroupChatCard } from '@/components/groups/GroupChatCard';
import { GroupChatView } from '@/components/groups/GroupChatView';
import { GridSkeleton } from '@/components/common/LoadingSkeleton';

const Groups = () => {
  const { isSignedIn, isLoaded } = useAuthGuard();
  const authLoading = !isLoaded;
  const { groupChats, isLoading, createGroupChat, leaveGroup, deleteGroup } = useGroupChats();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Show auth prompt if not signed in
  if (!authLoading && !isSignedIn) {
    return (
      <AuthPrompt
        title="Group Chats"
        description="Sign in to create and join group chats with other users."
      />
    );
  }

  // If a group is selected, show the chat view
  if (selectedGroupId) {
    return (
      <PageContainer className="p-0">
        <div className="h-screen">
          <GroupChatView
            groupId={selectedGroupId}
            onBack={() => setSelectedGroupId(null)}
          />
        </div>
      </PageContainer>
    );
  }

  const filteredGroups = useMemo(() => 
    groupChats.filter((group) =>
      group.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ),
    [groupChats, debouncedSearchQuery]
  );

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Group Chats</h1>
          <p className="text-muted-foreground mt-1">
            Collaborate with others in group conversations
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {/* Content */}
      {isLoading || authLoading ? (
        <GridSkeleton count={3} />
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'No groups found' : 'No group chats yet'}
          description={
            searchQuery
              ? 'Try a different search term'
              : 'Create a group to start collaborating with others'
          }
          actionLabel={!searchQuery ? 'Create Group' : undefined}
          onAction={!searchQuery ? () => setShowCreateDialog(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <GroupChatCard
              key={group.id}
              group={group}
              onClick={() => setSelectedGroupId(group.id)}
              onLeave={() => leaveGroup(group.id)}
              onDelete={() => deleteGroup(group.id)}
            />
          ))}
        </div>
      )}

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateGroup={createGroupChat}
      />
    </PageContainer>
  );
};

export default Groups;
