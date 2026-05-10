"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import { createEvent, getApiErrorMessage, getCurrentUser, getEvents } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Event, Role } from "@/lib/types";
import { eventSchema } from "@/lib/validators";

const MANAGER_ROLES: Role[] = ["GM", "ADMIN"];

type EventFormValues = z.input<typeof eventSchema>;

export function EventsShell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, hydrated, user, setUser, clearSession } = useAuthStore((state) => state);

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
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

  const currentUser = currentUserQuery.data?.user ?? user;
  const canManageEvents = Boolean(currentUser && MANAGER_ROLES.includes(currentUser.role));
  const [referenceNow] = useState(() => Date.now());

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      location: "",
      startsAt: "",
      endsAt: "",
      maxParticipants: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: EventFormValues) =>
      createEvent({
        title: values.title,
        summary: values.summary || undefined,
        description: values.description || undefined,
        location: values.location || undefined,
        startsAt: toIsoString(values.startsAt),
        endsAt: values.endsAt ? toIsoString(values.endsAt) : undefined,
        maxParticipants: toOptionalNumber(values.maxParticipants),
      }),
    onSuccess: async () => {
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  if (!hydrated || currentUserQuery.isLoading || eventsQuery.isLoading) {
    return <EventsPageSkeleton />;
  }

  if (!accessToken || !currentUser) {
    return null;
  }

  const events = eventsQuery.data?.events ?? [];
  const upcomingEvents = events.filter(
    (event) => new Date(event.startsAt).getTime() >= referenceNow,
  );
  const myPendingCount = events.reduce(
    (sum, event) =>
      sum +
      event.participations.filter(
        (participation) =>
          participation.character.ownerId === currentUser.id && participation.status === "PENDING",
      ).length,
    0,
  );

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>Eventy</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  Kalendarz sesji i zapisow
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  Tutaj sprawdzisz nadchodzace wydarzenia, zapiszesz swoje postacie i jako
                  MG przygotujesz nowe terminy rozgrywek.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {canManageEvents ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/mg">Panel MG</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        {currentUserQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(currentUserQuery.error)}</p>
        ) : null}
        {eventsQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(eventsQuery.error)}</p>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-3">
          <SummaryCard
            label="Wszystkie eventy"
            value={String(events.length)}
            description="Pelna lista zaplanowanych wydarzen dostepnych w aplikacji."
          />
          <SummaryCard
            label="Nadchodzace"
            value={String(upcomingEvents.length)}
            description="Eventy, ktore startuja teraz albo dopiero sa przed nami."
          />
          <SummaryCard
            label={canManageEvents ? "Do review" : "Moje oczekujace"}
            value={String(
              canManageEvents
                ? events.reduce((sum, event) => sum + event.pendingParticipantCount, 0)
                : myPendingCount,
            )}
            description={
              canManageEvents
                ? "Zgloszenia postaci, ktore czekaja jeszcze na decyzje MG lub administratora."
                : "Zapisy Twoich postaci, ktore nadal oczekuja na akceptacje."
            }
          />
        </section>

        {canManageEvents ? (
          <Card>
            <CardHeader>
              <CardTitle>Nowy event</CardTitle>
              <CardDescription>
                Prosty formularz MVP do publikacji wydarzenia i limitu miejsc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 lg:grid-cols-2"
                onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
              >
                <Field label="Tytul" error={form.formState.errors.title?.message}>
                  <Input {...form.register("title")} />
                </Field>
                <Field label="Miejsce" error={form.formState.errors.location?.message}>
                  <Input placeholder="Discord / forum / stol" {...form.register("location")} />
                </Field>
                <Field label="Start" error={form.formState.errors.startsAt?.message}>
                  <Input type="datetime-local" {...form.register("startsAt")} />
                </Field>
                <Field label="Koniec" error={form.formState.errors.endsAt?.message}>
                  <Input type="datetime-local" {...form.register("endsAt")} />
                </Field>
                <Field
                  label="Limit uczestnikow"
                  error={form.formState.errors.maxParticipants?.message}
                >
                  <Input placeholder="np. 4" {...form.register("maxParticipants")} />
                </Field>
                <Field label="Skrot opisu" error={form.formState.errors.summary?.message}>
                  <Textarea className="min-h-24" {...form.register("summary")} />
                </Field>
                <div className="lg:col-span-2">
                  <Field label="Opis eventu" error={form.formState.errors.description?.message}>
                    <Textarea className="min-h-32" {...form.register("description")} />
                  </Field>
                </div>
                <div className="lg:col-span-2">
                  <FormError
                    message={createMutation.isError ? getApiErrorMessage(createMutation.error) : undefined}
                  />
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Zapisywanie..." : "Utworz event"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <section className="space-y-4">
          <div>
            <h2 className="font-display text-3xl text-[color:var(--foreground)]">Lista eventow</h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-muted)]">
              Kliknij wybrany event, aby zobaczyc szczegoly, zapisy i panel uczestnikow.
            </p>
          </div>
          {events.length > 0 ? (
            <div className="grid gap-4">
              {events.map((event) => (
                <EventListCard event={event} key={event.id} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-sm leading-7 text-[color:var(--foreground-muted)]">
                Brak eventow. {canManageEvents ? "Dodaj pierwszy termin powyzej." : "Wroc tutaj pozniej."}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function EventListCard({ event }: { event: Event }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{formatEventDate(event.startsAt)}</Badge>
              {event.location ? <Badge>{event.location}</Badge> : null}
              {event.maxParticipants !== null ? (
                <Badge>
                  {event.approvedParticipantCount}/{event.maxParticipants} miejsc
                </Badge>
              ) : (
                <Badge>{event.approvedParticipantCount} uczestnikow</Badge>
              )}
              {event.pendingParticipantCount > 0 ? (
                <Badge>{event.pendingParticipantCount} oczekuje</Badge>
              ) : null}
            </div>
            <CardTitle className="mt-3 text-2xl">{event.title}</CardTitle>
            <CardDescription className="mt-2">
              {event.summary ?? "Brak krotkiego opisu eventu."}
            </CardDescription>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/events/${event.id}`}>Szczegoly eventu</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {event.description ? (
          <p className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
            {event.description}
          </p>
        ) : null}
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--foreground-subtle)]">
          Organizator: {event.creator.displayName || event.creator.username}
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

function EventsPageSkeleton() {
  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-48 rounded-[36px] bg-[color:var(--surface-strong)]" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-40 rounded-[28px] bg-[color:var(--surface-strong)]" />
          <div className="h-40 rounded-[28px] bg-[color:var(--surface-strong)]" />
          <div className="h-40 rounded-[28px] bg-[color:var(--surface-strong)]" />
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

function toIsoString(value: string) {
  return new Date(value).toISOString();
}

function toOptionalNumber(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return Number(trimmed);
}

function formatEventDate(value: string) {
  return new Date(value).toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
