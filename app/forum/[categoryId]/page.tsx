import { ForumCategoryShell } from "@/components/forum/forum-category-shell";

export default async function ForumCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  return <ForumCategoryShell categoryId={categoryId} />;
}
