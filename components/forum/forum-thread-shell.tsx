"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createForumPost, getApiErrorMessage, getForumThread } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { ForumPost } from "@/lib/types";
import { forumReplySchema } from "@/lib/validators";

type ForumReplyFormValues = z.input<typeof forumReplySchema>;

export function ForumThreadShell({
  categoryId,
  threadId,
}: {
  categoryId: string;
  threadId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, hydrated } = useAuthStore((state) => state);
  const [selectedQuote, setSelectedQuote] = useState<ForumPost | null>(null);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hydrated, router]);

  const query = useQuery({
    queryKey: ["forum", "thread", threadId],
    queryFn: () => getForumThread(threadId),
    enabled: hydrated && Boolean(accessToken),
  });

  const form = useForm<ForumReplyFormValues>({
    resolver: zodResolver(forumReplySchema),
    defaultValues: {
      content: "",
      quotePostId: undefined,
    },
  });

  useEffect(() => {
    form.setValue("quotePostId", selectedQuote?.id);
  }, [form, selectedQuote]);

  const mutation = useMutation({
    mutationFn: (values: ForumReplyFormValues) =>
      createForumPost(threadId, {
        content: values.content,
        quotePostId: values.quotePostId,
      }),
    onSuccess: async () => {
      setSelectedQuote(null);
      form.reset({
        content: "",
        quotePostId: undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["forum", "thread", threadId] });
      await queryClient.invalidateQueries({ queryKey: ["forum", "category", categoryId] });
      await queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
    },
  });

  const posts = query.data?.posts ?? [];
  const canReply = !query.data?.thread.isLocked;

  const postCountLabel = useMemo(() => {
    const count = query.data?.thread.postCount ?? 0;
    return `${count} ${count === 1 ? "post" : count < 5 ? "posty" : "postów"}`;
  }, [query.data?.thread.postCount]);

  if (!hydrated || (accessToken && query.isLoading)) {
    return (
      <div className="min-h-screen px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-14 w-96 rounded-full bg-[color:var(--surface-strong)]" />
          <div className="h-64 rounded-[28px] bg-[color:var(--surface-strong)]" />
          <div className="h-64 rounded-[28px] bg-[color:var(--surface-strong)]" />
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge>Wątek forum</Badge>
              {query.data?.thread.isPinned ? <Badge>Przypięty</Badge> : null}
              {query.data?.thread.isLocked ? <Badge>Zamknięty</Badge> : null}
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  {query.data?.thread.title ?? "Ładowanie wątku..."}
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  {query.data
                    ? `${getAuthorLabel(query.data.thread.author)} rozpoczął ten wątek. Ostatnia aktywność: ${formatForumDate(query.data.thread.lastPostAt)}.`
                    : "Trwa pobieranie szczegółów wątku."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary">
                  <Link href={`/forum/${query.data?.category.id ?? categoryId}`}>
                    Wróć do kategorii
                  </Link>
                </Button>
                <Button asChild size="lg">
                  <Link href={`/forum/new?categoryId=${query.data?.category.id ?? categoryId}`}>
                    Nowy wątek
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>
        {query.isError ? (
          <p className="text-sm text-[#9d3d2d]">
            {getApiErrorMessage(query.error)}
          </p>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>
              {query.data?.category.title ?? "Kategoria"} · {postCountLabel}
            </CardTitle>
            <CardDescription>
              {query.data?.category.description ||
                "Wątek należy do tej kategorii forum."}
            </CardDescription>
          </CardHeader>
        </Card>
        <section className="space-y-4">
          {posts.map((post, index) => (
            <Card id={`post-${post.id}`} key={post.id}>
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {index === 0 ? "Post otwierający" : `Odpowiedź ${index}`}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {getAuthorLabel(post.author)} · {formatForumDate(post.createdAt)}
                    </CardDescription>
                  </div>
                  {canReply ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setSelectedQuote(post)}
                    >
                      Cytuj
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {post.quotePost ? (
                  <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--foreground-subtle)]">
                      Cytat · {getAuthorLabel(post.quotePost.author)}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
                      {post.quotePost.content}
                    </p>
                  </div>
                ) : null}
                <p className="whitespace-pre-wrap text-base leading-8 text-[color:var(--foreground)]">
                  {post.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
        <Card>
          <CardHeader>
            <CardTitle>{canReply ? "Dodaj odpowiedź" : "Wątek jest zamknięty"}</CardTitle>
            <CardDescription>
              {canReply
                ? "Dopiszesz nową odpowiedź do wątku albo odpowiesz z cytatem wybranego posta."
                : "Ten wątek nie przyjmuje już nowych odpowiedzi."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canReply ? (
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              >
                {selectedQuote ? (
                  <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--foreground-subtle)]">
                          Cytujesz {getAuthorLabel(selectedQuote.author)}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
                          {selectedQuote.content}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setSelectedQuote(null)}
                      >
                        Usuń cytat
                      </Button>
                    </div>
                  </div>
                ) : null}
                <Textarea
                  className="min-h-48"
                  {...form.register("content")}
                  placeholder="Opisz scenę, odpowiedz graczowi albo rozwiń wątki fabularne..."
                />
                <FormError message={form.formState.errors.content?.message} />
                <FormError
                  message={mutation.isError ? getApiErrorMessage(mutation.error) : undefined}
                />
                <div className="flex gap-3">
                  <Button size="lg" type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Zapisywanie..." : "Dodaj odpowiedź"}
                  </Button>
                </div>
              </form>
            ) : null}
          </CardContent>
        </Card>
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

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#9d3d2d]">{message}</p>;
}
