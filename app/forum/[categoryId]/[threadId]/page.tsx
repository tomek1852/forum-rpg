import { ForumThreadShell } from "@/components/forum/forum-thread-shell";

export default function ForumThreadPage({
  params,
}: {
  params: { categoryId: string; threadId: string };
}) {
  return (
    <ForumThreadShell
      categoryId={params.categoryId}
      threadId={params.threadId}
    />
  );
}
