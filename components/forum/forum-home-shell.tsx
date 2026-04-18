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
import { getApiErrorMessage, getForumCategories } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function ForumHomeShell() {
  const router = useRouter();
  const { accessToken, hydrated } = useAuthStore((state) => state);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hydrated, router]);

  const query = useQuery({
    queryKey: ["forum", "categories"],
    queryFn: getForumCategories,
    enabled: hydrated && Boolean(accessToken),
  });

  if (!hydrated || (accessToken && query.isLoading)) {
    return (
      <div className="min-h-screen px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-14 w-72 rounded-full bg-[color:var(--surface-strong)]" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-56 rounded-[28px] bg-[color:var(--surface-strong)]" />
            <div className="h-56 rounded-[28px] bg-[color:var(--surface-strong)]" />
            <div className="h-56 rounded-[28px] bg-[color:var(--surface-strong)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>Forum</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  Kategorie i wątki
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  Wybierz kategorię, przejdź do aktywnych wątków i załóż nową
                  scenę dla swojej opowieści.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/forum/new">Nowy wątek</Link>
              </Button>
            </div>
          </div>
        </header>
        {query.isError ? (
          <p className="text-sm text-[#9d3d2d]">
            {getApiErrorMessage(query.error)}
          </p>
        ) : null}
        <section className="grid gap-6 lg:grid-cols-3">
          {query.data?.categories.map((category) => (
            <Card className="overflow-hidden" key={category.id}>
              <div
                className="h-2 w-full"
                style={{ backgroundColor: category.color ?? "#9d3d2d" }}
              />
              <CardHeader>
                <CardDescription>{category.threadCount} wątków</CardDescription>
                <CardTitle>{category.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                  {category.description ||
                    "Ta kategoria czeka na pierwsze sceny i wpisy."}
                </p>
                {category.latestThread ? (
                  <div className="rounded-[24px] bg-[color:var(--surface)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--foreground-subtle)]">
                      Ostatnia aktywność
                    </p>
                    <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                      {category.latestThread.title}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
                      {getAuthorLabel(category.latestThread.author)} ·{" "}
                      {formatForumDate(category.latestThread.lastPostAt)}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[24px] bg-[color:var(--surface)] p-4 text-sm leading-6 text-[color:var(--foreground-muted)]">
                    Brak wątków w tej kategorii. Możesz założyć pierwszy.
                  </div>
                )}
                <Button asChild className="w-full" variant="secondary">
                  <Link href={`/forum/${category.id}`}>Otwórz kategorię</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
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
