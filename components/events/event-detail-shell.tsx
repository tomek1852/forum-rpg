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
import {
  createEventParticipation,
  getApiErrorMessage,
  getCurrentUser,
  getEvent,
  getMyCharacters,
  reviewEventParticipation,
  updateEvent,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { EventParticipation, EventParticipationStatus, Role } from "@/lib/types";
import { eventParticipationSchema, eventSchema } from "@/lib/validators";

const MANAGER_ROLES: Role[] = ["GM", "ADMIN"];

type EventFormValues = z.input<typeof eventSchema>;
type ParticipationFormValues = z.input<typeof eventParticipationSchema>;

export function EventDetailShell({ eventId }: { eventId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const { accessToken, hydrated, user, setUser, clearSession } = useAuthStore((state) => state);

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const eventQuery = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEvent(eventId),
    enabled: hydrated && Boolean(accessToken),
  });

  const charactersQuery = useQuery({
    queryKey: ["my-characters"],
    queryFn: getMyCharacters,
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

  const editForm = useForm<EventFormValues>({
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

  const participationForm = useForm<ParticipationFormValues>({
    resolver: zodResolver(eventParticipationSchema),
    defaultValues: {
      characterId: "",
      note: "",
    },
  });

  useEffect(() => {
    if (!eventQuery.data?.event) {
      return;
    }

    const event = eventQuery.data.event;
    editForm.reset({
      title: event.title,
      summary: event.summary ?? "",
      description: event.description ?? "",
      location: event.location ?? "",
      startsAt: toDateTimeLocalValue(event.startsAt),
      endsAt: event.endsAt ? toDateTimeLocalValue(event.endsAt) : "",
      maxParticipants: event.maxParticipants !== null ? String(event.maxParticipants) : "",
    });
  }, [editForm, eventQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (values: EventFormValues) =>
      updateEvent(eventId, {
        title: values.title,
        summary: values.summary || undefined,
        description: values.description || undefined,
        location: values.location || undefined,
        startsAt: toIsoString(values.startsAt),
        endsAt: values.endsAt ? toIsoString(values.endsAt) : undefined,
        maxParticipants: toOptionalNumber(values.maxParticipants),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
        queryClient.invalidateQueries({ queryKey: ["events"] }),
      ]);
    },
  });

  const participationMutation = useMutation({
    mutationFn: (values: ParticipationFormValues) =>
      createEventParticipation(eventId, {
        characterId: values.characterId,
        note: values.note || undefined,
      }),
    onSuccess: async () => {
      participationForm.reset({ characterId: "", note: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
        queryClient.invalidateQueries({ queryKey: ["events"] }),
      ]);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      participationId,
      status,
    }: {
      participationId: string;
      status: EventParticipationStatus;
    }) =>
      reviewEventParticipation(participationId, {
        status,
        reviewerComment: reviewComments[participationId]?.trim() || undefined,
      }),
    onSuccess: async (_, variables) => {
      setReviewComments((current) => ({ ...current, [variables.participationId]: "" }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
        queryClient.invalidateQueries({ queryKey: ["events"] }),
      ]);
    },
  });

  if (!hydrated || currentUserQuery.isLoading || eventQuery.isLoading || charactersQuery.isLoading) {
    return <EventDetailSkeleton />;
  }

  if (!accessToken || !currentUser || !eventQuery.data) {
    return null;
  }

  const event = eventQuery.data.event;
  const myCharacters = charactersQuery.data?.characters ?? [];
  const takenCharacterIds = new Set(event.participations.map((participation) => participation.characterId));
  const availableCharacters = myCharacters.filter((character) => !takenCharacterIds.has(character.id));
  const pendingParticipations = event.participations.filter(
    (participation) => participation.status === "PENDING",
  );
  const approvedParticipations = event.participations.filter(
    (participation) => participation.status === "APPROVED",
  );
  const rejectedParticipations = event.participations.filter(
    (participation) => participation.status === "REJECTED",
  );

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>{formatDateTime(event.startsAt)}</Badge>
                {event.location ? <Badge>{event.location}</Badge> : null}
                {event.remainingSlots !== null ? (
                  <Badge>{event.remainingSlots} wolnych miejsc</Badge>
                ) : null}
              </div>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">{event.title}</h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  {event.summary ?? "Brak krotkiego opisu eventu."}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[color:var(--foreground-subtle)]">
                  Organizator: {event.creator.displayName || event.creator.username}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/events">Wroc do eventow</Link>
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
        {eventQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(eventQuery.error)}</p>
        ) : null}
        {charactersQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(charactersQuery.error)}</p>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-3">
          <SummaryCard
            label="Zaakceptowani"
            value={String(event.approvedParticipantCount)}
            description="Postacie, ktore maja juz potwierdzone miejsce na wydarzeniu."
          />
          <SummaryCard
            label="Oczekujace"
            value={String(event.pendingParticipantCount)}
            description="Zgloszenia, ktore nie dostaly jeszcze decyzji."
          />
          <SummaryCard
            label="Limit"
            value={event.maxParticipants !== null ? String(event.maxParticipants) : "Bez limitu"}
            description="Maksymalna liczba zaakceptowanych uczestnikow w tym evencie."
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Opis eventu</CardTitle>
              <CardDescription>
                Start: {formatDateTime(event.startsAt)}
                {event.endsAt ? ` · Koniec: ${formatDateTime(event.endsAt)}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
                {event.description ?? "Organizator nie dodal jeszcze pelnego opisu wydarzenia."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zapisz postac</CardTitle>
              <CardDescription>
                Zglos swoja postac do eventu. Zapis trafi do akceptacji MG lub administratora.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableCharacters.length > 0 ? (
                <form
                  className="grid gap-4"
                  onSubmit={participationForm.handleSubmit((values) =>
                    participationMutation.mutate(values),
                  )}
                >
                  <Field
                    label="Postac"
                    error={participationForm.formState.errors.characterId?.message}
                  >
                    <select
                      className="h-12 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
                      {...participationForm.register("characterId")}
                    >
                      <option value="">Wybierz postac</option>
                      {availableCharacters.map((character) => (
                        <option key={character.id} value={character.id}>
                          {character.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Notatka" error={participationForm.formState.errors.note?.message}>
                    <Textarea
                      className="min-h-24"
                      placeholder="Opcjonalna informacja dla MG"
                      {...participationForm.register("note")}
                    />
                  </Field>
                  <FormError
                    message={
                      participationMutation.isError
                        ? getApiErrorMessage(participationMutation.error)
                        : undefined
                    }
                  />
                  <Button type="submit" disabled={participationMutation.isPending}>
                    {participationMutation.isPending ? "Zapisywanie..." : "Zapisz postac"}
                  </Button>
                </form>
              ) : (
                <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                  Nie masz juz wolnej postaci do zapisania na ten event albo wszystkie zostaly
                  juz zgloszone.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {canManageEvents ? (
          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader>
                <CardTitle>Edytuj event</CardTitle>
                <CardDescription>
                  Szybka korekta opisu, terminu i limitu uczestnikow bez dodatkowego panelu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4"
                  onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}
                >
                  <Field label="Tytul" error={editForm.formState.errors.title?.message}>
                    <Input {...editForm.register("title")} />
                  </Field>
                  <Field label="Miejsce" error={editForm.formState.errors.location?.message}>
                    <Input {...editForm.register("location")} />
                  </Field>
                  <Field label="Start" error={editForm.formState.errors.startsAt?.message}>
                    <Input type="datetime-local" {...editForm.register("startsAt")} />
                  </Field>
                  <Field label="Koniec" error={editForm.formState.errors.endsAt?.message}>
                    <Input type="datetime-local" {...editForm.register("endsAt")} />
                  </Field>
                  <Field
                    label="Limit uczestnikow"
                    error={editForm.formState.errors.maxParticipants?.message}
                  >
                    <Input {...editForm.register("maxParticipants")} />
                  </Field>
                  <Field label="Skrot opisu" error={editForm.formState.errors.summary?.message}>
                    <Textarea className="min-h-24" {...editForm.register("summary")} />
                  </Field>
                  <Field label="Opis" error={editForm.formState.errors.description?.message}>
                    <Textarea className="min-h-32" {...editForm.register("description")} />
                  </Field>
                  <FormError
                    message={updateMutation.isError ? getApiErrorMessage(updateMutation.error) : undefined}
                  />
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Panel uczestnikow</CardTitle>
                <CardDescription>
                  Akceptuj lub odrzucaj zgloszenia bez rozbudowanego workflow realtime.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingParticipations.length > 0 ? (
                  pendingParticipations.map((participation) => (
                    <ParticipationReviewCard
                      participation={participation}
                      reviewComment={reviewComments[participation.id] ?? ""}
                      reviewPending={reviewMutation.isPending}
                      onCommentChange={(value) =>
                        setReviewComments((current) => ({ ...current, [participation.id]: value }))
                      }
                      onReview={(status) =>
                        reviewMutation.mutate({
                          participationId: participation.id,
                          status,
                        })
                      }
                      key={participation.id}
                    />
                  ))
                ) : (
                  <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                    Brak zgloszen oczekujacych na review.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <ParticipationListCard
            title="Uczestnicy"
            description="Postacie, ktore maja juz potwierdzone miejsce."
            participations={approvedParticipations}
            emptyMessage="Nie ma jeszcze zaakceptowanych uczestnikow."
          />
          <ParticipationListCard
            title="Pozostale zgloszenia"
            description="Widoczne dla Ciebie wpisy oczekujace lub odrzucone."
            participations={[...pendingParticipations, ...rejectedParticipations]}
            emptyMessage="Brak dodatkowych zgloszen do pokazania."
          />
        </section>
      </div>
    </div>
  );
}

function ParticipationReviewCard({
  participation,
  reviewComment,
  reviewPending,
  onCommentChange,
  onReview,
}: {
  participation: EventParticipation;
  reviewComment: string;
  reviewPending: boolean;
  onCommentChange: (value: string) => void;
  onReview: (status: EventParticipationStatus) => void;
}) {
  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-white p-5">
      <div className="flex flex-wrap gap-2">
        <Badge>Oczekuje</Badge>
        <Badge>{participation.character.name}</Badge>
        {participation.character.world ? <Badge>{participation.character.world.name}</Badge> : null}
      </div>
      <p className="mt-3 text-sm font-semibold text-[color:var(--foreground)]">
        {participation.character.title ?? "Bez tytulu"}
      </p>
      {participation.note ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
          {participation.note}
        </p>
      ) : (
        <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
          Brak notatki od gracza.
        </p>
      )}
      <div className="mt-4">
        <Label>Komentarz do decyzji</Label>
        <Textarea
          className="min-h-24"
          value={reviewComment}
          onChange={(event) => onCommentChange(event.target.value)}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" disabled={reviewPending} onClick={() => onReview("APPROVED")}>
          {reviewPending ? "Zapisywanie..." : "Akceptuj"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={reviewPending}
          onClick={() => onReview("REJECTED")}
        >
          Odrzuc
        </Button>
      </div>
    </div>
  );
}

function ParticipationListCard({
  title,
  description,
  participations,
  emptyMessage,
}: {
  title: string;
  description: string;
  participations: EventParticipation[];
  emptyMessage: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {participations.length > 0 ? (
          participations.map((participation) => (
            <div className="rounded-[22px] bg-[color:var(--surface)] px-4 py-4" key={participation.id}>
              <div className="flex flex-wrap gap-2">
                <Badge>{formatParticipationStatus(participation.status)}</Badge>
                <Badge>{participation.character.name}</Badge>
                {participation.decidedAt ? <Badge>{formatDate(participation.decidedAt)}</Badge> : null}
              </div>
              <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                {participation.character.title ?? "Bez tytulu"}
              </p>
              {participation.note ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
                  {participation.note}
                </p>
              ) : null}
              {participation.reviewerComment ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
                  <strong className="text-[color:var(--foreground)]">Komentarz MG:</strong>{" "}
                  {participation.reviewerComment}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">{emptyMessage}</p>
        )}
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

function EventDetailSkeleton() {
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

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pl-PL");
}

function formatParticipationStatus(status: EventParticipationStatus) {
  switch (status) {
    case "APPROVED":
      return "Zaakceptowana";
    case "REJECTED":
      return "Odrzucona";
    default:
      return "Oczekuje";
  }
}
