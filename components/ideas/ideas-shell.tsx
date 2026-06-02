"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createIdea,
  getApiErrorMessage,
  getCurrentUser,
  getIdeas,
  updateIdeaStatus,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Idea, IdeaStatus } from "@/lib/types";

const ideaSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć minimum 3 znaki"),
  content: z.string().min(10, "Treść musi mieć minimum 10 znaków"),
  category: z.string().optional(),
});

type IdeaFormValues = z.input<typeof ideaSchema>;

const STATUS_LABELS: Record<IdeaStatus, string> = {
  OPEN: "Otwarte",
  UNDER_REVIEW: "W trakcie przeglądu",
  ACCEPTED: "Zaakceptowane",
  REJECTED: "Odrzucone",
};

const STATUS_COLORS: Record<IdeaStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const GM_STATUSES: IdeaStatus[] = ["UNDER_REVIEW", "ACCEPTED", "REJECTED"];

export function IdeasShell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, hydrated, user } = useAuthStore((state) => state);
  const [filterStatus, setFilterStatus] = useState<IdeaStatus | "">("");
  const [gmNotes, setGmNotes] = useState<Record<string, string>>({});

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const currentUser = currentUserQuery.data?.user ?? user;
  const isGm = currentUser?.role === "GM" || currentUser?.role === "ADMIN";

  const ideasQuery = useQuery({
    queryKey: ["ideas", filterStatus],
    queryFn: () => getIdeas(filterStatus || undefined),
    enabled: hydrated && Boolean(accessToken),
  });

  const ideas: Idea[] = ideasQuery.data?.ideas ?? [];

  const form = useForm<IdeaFormValues>({ resolver: zodResolver(ideaSchema) });

  const createMutation = useMutation({
    mutationFn: (values: IdeaFormValues) =>
      createIdea({ title: values.title, content: values.content, category: values.category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      form.reset();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, gmNote }: { id: string; status: IdeaStatus; gmNote?: string }) =>
      updateIdeaStatus(id, { status, gmNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });

  if (!hydrated || (accessToken && currentUserQuery.isLoading)) {
    return (
      <div className="min-h-screen px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-4xl animate-pulse space-y-6">
          <div className="h-40 rounded-[36px] bg-[color:var(--surface-strong)]" />
        </div>
      </div>
    );
  }

  if (!accessToken) {
    router.replace("/login");
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <Badge>Pomysły</Badge>
          <h1 className="mt-4 font-display text-4xl text-[color:var(--foreground)]">
            Zgłoszenia pomysłów
          </h1>
          <p className="mt-2 text-[color:var(--foreground-muted)]">
            Prześlij pomysł do mistrzów gry lub przeglądaj istniejące zgłoszenia.
          </p>
        </header>

        {/* Submit form */}
        <Card>
          <CardHeader>
            <CardTitle>Nowy pomysł</CardTitle>
            <CardDescription>Opisz swój pomysł — GM przejrzy i odpowie.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title">Tytuł</Label>
                <Input
                  id="title"
                  placeholder="Krótki tytuł pomysłu"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="mt-1 text-xs text-[#9d3d2d]">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="category">Kategoria (opcjonalna)</Label>
                <Input
                  id="category"
                  placeholder="np. Mechanika, Fabuła, Świat..."
                  {...form.register("category")}
                />
              </div>
              <div>
                <Label htmlFor="content">Opis</Label>
                <Textarea
                  id="content"
                  rows={4}
                  placeholder="Szczegółowy opis pomysłu..."
                  {...form.register("content")}
                />
                {form.formState.errors.content && (
                  <p className="mt-1 text-xs text-[#9d3d2d]">
                    {form.formState.errors.content.message}
                  </p>
                )}
              </div>
              {createMutation.isError && (
                <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(createMutation.error)}</p>
              )}
              {createMutation.isSuccess && (
                <p className="text-sm text-green-700">Pomysł został zgłoszony!</p>
              )}
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Wysyłanie..." : "Zgłoś pomysł"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Ideas list */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Lista pomysłów</CardTitle>
              <select
                className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as IdeaStatus | "")}
              >
                <option value="">Wszystkie statusy</option>
                {(Object.keys(STATUS_LABELS) as IdeaStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {ideasQuery.isLoading ? (
              <p className="text-sm text-[color:var(--foreground-muted)]">Ładowanie...</p>
            ) : ideas.length === 0 ? (
              <p className="text-sm text-[color:var(--foreground-muted)]">Brak pomysłów.</p>
            ) : (
              <div className="space-y-4">
                {ideas.map((idea) => (
                  <div
                    key={idea.id}
                    className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[color:var(--foreground)]">
                          {idea.title}
                        </div>
                        <div className="text-xs text-[color:var(--foreground-muted)]">
                          {idea.author.displayName ?? idea.author.username}
                          {idea.category && ` · ${idea.category}`}
                          {" · "}
                          {new Date(idea.createdAt).toLocaleDateString("pl-PL")}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[idea.status]}`}
                      >
                        {STATUS_LABELS[idea.status]}
                      </span>
                    </div>
                    <p className="text-sm text-[color:var(--foreground-muted)] whitespace-pre-wrap">
                      {idea.content}
                    </p>
                    {idea.gmNote && (
                      <div className="rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm">
                        <span className="font-semibold">Notatka MG: </span>
                        {idea.gmNote}
                      </div>
                    )}
                    {isGm && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Input
                          placeholder="Notatka MG (opcjonalna)"
                          className="h-8 max-w-xs text-sm"
                          value={gmNotes[idea.id] ?? ""}
                          onChange={(e) =>
                            setGmNotes((prev) => ({ ...prev, [idea.id]: e.target.value }))
                          }
                        />
                        {GM_STATUSES.map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={idea.status === s ? "default" : "secondary"}
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                id: idea.id,
                                status: s,
                                gmNote: gmNotes[idea.id],
                              })
                            }
                          >
                            {STATUS_LABELS[s]}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
