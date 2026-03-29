"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiErrorMessage, getForumCategory } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function ForumCategoryShell({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const { accessToken, hydrated } = useAuthStore((state) => state);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hydrated, router]);

  const query = useQuery({
    queryKey: ["forum", "category", categoryId],
    queryFn: () => getForumCategory(categoryId),
    enabled: hydrated && Boolean(accessToken),
  });

  if (!hydrated || (accessToken && query.isLoading)) {
    return (
      <div className="min-h-screen px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-14 w-96 rounded-full bg-[color:var(--surface-strong)]" />
          <div className="h-40 rounded-[28px] bg-[color:var(--surface-strong)]" />
          <div className="h-40 rounded-[28px] bg-[color:var(--surface-strong)]" />
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  const category = query.data?.category;

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>Kategoria forum</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  {category?.title ?? "Ladowanie kategorii..."}
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  {category?.description ||
                    "Przegladaj watki i dolacz do scen, ktore rozwijaja swiat gry."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/forum">Wroc do forum</Link>
              </Button>
              <Button asChild size="lg">
                <Link href={`/forum/new?categoryId=${categoryId}`}>Nowy watek</Link>
              </Button>
            </div>
          </div>
        </header>
        {query.isError ? (
          <p className="text-sm text-[#9d3d2d]">
            {getApiErrorMessage(query.error)}
          </p>
        ) : null}
        <section className="grid gap-4">
          {query.data?.threads.length ? (
            query.data.threads.map((thread) => (
              <Card key={thread.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <CardTitle>{thread.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {getAuthorLabel(thread.author)} · {thread.postCount} postow
                        · ostatnia aktywnosc {formatForumDate(thread.lastPostAt)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {thread.isPinned ? <Badge>Przypiety</Badge> : null}
                      {thread.isLocked ? <Badge>Zamkniety</Badge> : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <p className="max-w-3xl text-sm leading-7 text-[color:var(--foreground-muted)]">
                    {thread.excerpt || "Ten watek nie ma jeszcze opisu startowego."}
                  </p>
                  <Button asChild variant="secondary">
                    <Link href={`/forum/${categoryId}/${thread.id}`}>Otworz watek</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-10 text-sm leading-7 text-[color:var(--foreground-muted)]">
                Ta kategoria nie ma jeszcze zadnych watkow. Zaloz pierwszy i
                rozpocznij scene.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function formatForumDate(value: string) {
  return new Date(value).toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getAuthorLabel(author: { displayName: string | null; username: string }) {
  return author.displayName || author.username;
}
