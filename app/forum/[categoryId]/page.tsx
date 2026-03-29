import { ForumCategoryShell } from "@/components/forum/forum-category-shell";

export default function ForumCategoryPage({
  params,
}: {
  params: { categoryId: string };
}) {
  return <ForumCategoryShell categoryId={params.categoryId} />;
}
