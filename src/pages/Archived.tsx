import { PageContainer } from '@/components/layout/PageContainer';

const Archived = () => {
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold text-foreground mb-2">Archived Chats</h1>
      <p className="text-muted-foreground mb-8">Your archived conversations</p>
      <div className="text-muted-foreground text-center py-12">
        No archived chats yet
      </div>
    </PageContainer>
  );
};

export default Archived;
