"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createWorldLog, getApiErrorMessage, getCurrentUser, getWorldLogs } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { WorldLogEntry } from "@/lib/types";
import { worldLogSchema } from "@/lib/validators";

type WorldLogFormValues = z.input<typeof worldLogSchema>;

export function WorldLogShell({ worldId }: { worldId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, hydrated, user, setUser, clearSession } = useAuthStore((state) => state);

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const worldLogsQuery = useQuery({
    queryKey: ["world-logs", worldId],
    queryFn: () => getWorldLogs(worldId),
    enabled: hydrated && Boolean(accessToken),
  });

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hydrated, router]);

  useEffect(() => {
    if (currentUserQuery.data?.user) {
      setUser(currentUserQuery.data.user);
    }
  }, [currentUserQuery.data, setUser]);

  useEffect(() => {
    if (currentUserQuery.isError) {
      clearSession();
      router.replace("/login");
    }
  }, [clearSession, currentUserQuery.isError, router]);

  const form = useForm<WorldLogFormValues>({
    resolver: zodResolver(worldLogSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: WorldLogFormValues) =>
      createWorldLog(worldId, {
        title: values.title,
        content: values.content,
      }),
    onSuccess: async () => {
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["world-logs", worldId] });
    },
  });

  if (!hydrated || currentUserQuery.isLoading || worldLogsQuery.isLoading) {
    return <WorldLogSkeleton />;
  }

  if (!accessToken) {
    return null;
  }

  const currentUser = currentUserQuery.data?.user ?? user;
  const canManageWorldLog = currentUser?.role === "GM" || currentUser?.role === "ADMIN";
  const world = worldLogsQuery.data?.world;
  const entries = worldLogsQuery.data?.entries ?? [];

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>WorldLog</Badge>
                {world?.slug ? <Badge>{world.slug}</Badge> : null}
              </div>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  {world?.name ?? "Kronika swiata"}
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  {world?.summary ??
                    "Najwazniejsze wydarzenia, zmiany fabularne i oficjalne wpisy dla tego swiata."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/worlds">Lista swiatow</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </header>

        {currentUserQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(currentUserQuery.error)}</p>
        ) : null}
        {worldLogsQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(worldLogsQuery.error)}</p>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-3">
          <SummaryCard
            label="Liczba wpisow"
            value={String(entries.length)}
            description="Pelna liczba opublikowanych wpisow WorldLog w tym swiecie."
          />
          <SummaryCard
            label="Najnowszy wpis"
            value={entries[0] ? formatDate(entries[0].createdAt) : "Brak"}
            description="Data ostatniej aktualizacji kroniki swiata."
          />
          <SummaryCard
            label="Publikacja"
            value={canManageWorldLog ? "GM/Admin" : "Tylko odczyt"}
            description="Tworzenie wpisow zostaje ograniczone do rol managerskich."
          />
        </section>

        {canManageWorldLog ? (
          <Card>
            <CardHeader>
              <CardTitle>Dodaj wpis WorldLog</CardTitle>
              <CardDescription>
                Prosty formularz MVP do publikacji nowego wpisu bez edytora i bez realtime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
              >
                <Field label="Tytul" error={form.formState.errors.title?.message}>
                  <Input {...form.register("title")} />
                </Field>
                <Field label="Tresc wpisu" error={form.formState.errors.content?.message}>
                  <Textarea className="min-h-40" {...form.register("content")} />
                </Field>
                <FormError
                  message={createMutation.isError ? getApiErrorMessage(createMutation.error) : undefined}
                />
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Zapisywanie..." : "Dodaj wpis"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <section className="space-y-4">
          <div>
            <h2 className="font-display text-3xl text-[color:var(--foreground)]">Wpisy WorldLog</h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-muted)]">
              Prosta kronika wydarzen w kolejnosci od najnowszych do najstarszych.
            </p>
          </div>
          {entries.length > 0 ? (
            <div className="grid gap-4">
              {entries.map((entry) => (
                <WorldLogCard entry={entry} key={entry.id} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-sm leading-7 text-[color:var(--foreground-muted)]">
                Brak wpisow WorldLog dla tego swiata. {canManageWorldLog ? "Dodaj pierwszy wpis powyzej." : ""}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function WorldLogCard({ entry }: { entry: WorldLogEntry }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{formatDateTime(entry.createdAt)}</Badge>
              <Badge>{entry.author.displayName || entry.author.username}</Badge>
            </div>
            <CardTitle className="mt-3 text-2xl">{entry.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
          {entry.content}
        </p>
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-7 text-[color:var(--foreground-muted)]">
        {description}
      </CardContent>
    </Card>
  );
}

function WorldLogSkeleton() {
  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-48 rounded-[36px] bg-[color:var(--surface-strong)]" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-32 rounded-[28px] bg-[color:var(--surface-strong)]" />
          <div className="h-32 rounded-[28px] bg-[color:var(--surface-strong)]" />
          <div className="h-32 rounded-[28px] bg-[color:var(--surface-strong)]" />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      <FormError message={error} />
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-[#9d3d2d]">{message}</p>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pl-PL");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
