import { ForumThreadShell } from "@/components/forum/forum-thread-shell";

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ categoryId: string; threadId: string }>;
}) {
  const { categoryId, threadId } = await params;
  return (
    <ForumThreadShell
      categoryId={categoryId}
      threadId={threadId}
    />
  );
}
