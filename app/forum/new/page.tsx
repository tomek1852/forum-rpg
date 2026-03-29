import { ForumThreadForm } from "@/components/forum/forum-thread-form";

export default function NewForumThreadPage({
  searchParams,
}: {
  searchParams?: { categoryId?: string };
}) {
  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <ForumThreadForm initialCategoryId={searchParams?.categoryId} />
      </div>
    </div>
  );
}
