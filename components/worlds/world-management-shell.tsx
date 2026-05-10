"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createWorld,
  createWorldStatDefinition,
  getApiErrorMessage,
  getCurrentUser,
  getSkillProposalsReviewQueue,
  getWorlds,
  reviewSkillProposal,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Role, SkillProposal, SkillProposalStatus } from "@/lib/types";
import { statDefinitionSchema, worldSchema } from "@/lib/validators";

const MANAGER_ROLES: Role[] = ["GM", "ADMIN"];

type WorldFormValues = z.input<typeof worldSchema>;
type StatDefinitionFormValues = z.input<typeof statDefinitionSchema>;

export function WorldManagementShell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const { accessToken, hydrated, user, setUser, clearSession } = useAuthStore((state) => state);

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const currentUser = currentUserQuery.data?.user ?? user;
  const canManageWorlds = Boolean(currentUser && MANAGER_ROLES.includes(currentUser.role));

  const worldsQuery = useQuery({
    queryKey: ["worlds"],
    queryFn: getWorlds,
    enabled: hydrated && Boolean(accessToken) && canManageWorlds,
  });

  const proposalsQuery = useQuery({
    queryKey: ["skill-proposals-review"],
    queryFn: getSkillProposalsReviewQueue,
    enabled: hydrated && Boolean(accessToken) && canManageWorlds,
  });

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!accessToken) {
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

  useEffect(() => {
    if (hydrated && accessToken && currentUser && !canManageWorlds) {
      router.replace("/dashboard");
    }
  }, [accessToken, canManageWorlds, currentUser, hydrated, router]);

  const worldForm = useForm<WorldFormValues>({
    resolver: zodResolver(worldSchema),
    defaultValues: {
      name: "",
      slug: "",
      summary: "",
      description: "",
    },
  });

  const statForm = useForm<StatDefinitionFormValues>({
    resolver: zodResolver(statDefinitionSchema),
    defaultValues: {
      worldId: "",
      key: "",
      label: "",
      description: "",
      valueType: "NUMBER",
      minValue: "",
      maxValue: "",
      defaultNumericValue: "",
      defaultTextValue: "",
      isRequired: false,
      position: "",
    },
  });

  const selectedValueType = useWatch({
    control: statForm.control,
    name: "valueType",
  });

  const worldMutation = useMutation({
    mutationFn: createWorld,
    onSuccess: async () => {
      worldForm.reset();
      await queryClient.invalidateQueries({ queryKey: ["worlds"] });
    },
  });

  const statMutation = useMutation({
    mutationFn: async (values: StatDefinitionFormValues) =>
      createWorldStatDefinition({
        worldId: values.worldId,
        key: values.key,
        label: values.label,
        description: values.description || undefined,
        valueType: values.valueType,
        minValue: toOptionalNumber(values.minValue),
        maxValue: toOptionalNumber(values.maxValue),
        defaultNumericValue: toOptionalNumber(values.defaultNumericValue),
        defaultTextValue: values.defaultTextValue || undefined,
        isRequired: values.isRequired ?? false,
        position: toOptionalNumber(values.position),
      }),
    onSuccess: async () => {
      const currentWorldId = statForm.getValues("worldId");
      statForm.reset({
        worldId: currentWorldId,
        key: "",
        label: "",
        description: "",
        valueType: "NUMBER",
        minValue: "",
        maxValue: "",
        defaultNumericValue: "",
        defaultTextValue: "",
        isRequired: false,
        position: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["worlds"] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      proposalId,
      status,
    }: {
      proposalId: string;
      status: SkillProposalStatus;
    }) =>
      reviewSkillProposal(proposalId, {
        status,
        reviewerComment: reviewComments[proposalId]?.trim() || undefined,
      }),
    onSuccess: async (_, variables) => {
      setReviewComments((current) => ({ ...current, [variables.proposalId]: "" }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["skill-proposals-review"] }),
        queryClient.invalidateQueries({ queryKey: ["character"] }),
      ]);
    },
  });

  if (
    !hydrated ||
    currentUserQuery.isLoading ||
    (canManageWorlds && (worldsQuery.isLoading || proposalsQuery.isLoading))
  ) {
    return (
      <div className="min-h-screen px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-14 w-80 rounded-full bg-[color:var(--surface-strong)]" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-80 rounded-[28px] bg-[color:var(--surface-strong)]" />
            <div className="h-80 rounded-[28px] bg-[color:var(--surface-strong)]" />
          </div>
          <div className="h-64 rounded-[28px] bg-[color:var(--surface-strong)]" />
        </div>
      </div>
    );
  }

  if (!accessToken || !currentUser || !canManageWorlds) {
    return null;
  }

  const worlds = worldsQuery.data?.worlds ?? [];
  const proposals = proposalsQuery.data?.proposals ?? [];
  const pendingProposals = proposals.filter((proposal) => proposal.status === "PENDING");

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>MG</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  Światy i review umiejętności
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  Tutaj dodasz światy gry, zdefiniujesz statystyki i rozpatrzysz nowe
                  propozycje umiejętności od graczy.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/moderation">Moderacja</Link>
              </Button>
            </div>
          </div>
        </header>

        {currentUserQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(currentUserQuery.error)}</p>
        ) : null}
        {worldsQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(worldsQuery.error)}</p>
        ) : null}
        {proposalsQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(proposalsQuery.error)}</p>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-3">
          <SummaryCard
            label="Światy"
            value={String(worlds.length)}
            description="Aktywne konfiguracje rozgrywki dostępne dla kart postaci."
          />
          <SummaryCard
            label="Definicje statystyk"
            value={String(worlds.reduce((sum, world) => sum + world.statDefinitions.length, 0))}
            description="Łączna liczba pól zdefiniowanych dla wszystkich światów."
          />
          <SummaryCard
            label="Do review"
            value={String(pendingProposals.length)}
            description="Propozycje umiejętności oczekujące na decyzję MG lub administratora."
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nowy świat</CardTitle>
              <CardDescription>
                Dodaj świat, do którego później przypiszesz postacie i ich statystyki.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={worldForm.handleSubmit((values) => worldMutation.mutate(values))}
              >
                <Field label="Nazwa świata" error={worldForm.formState.errors.name?.message}>
                  <Input {...worldForm.register("name")} />
                </Field>
                <Field label="Slug (opcjonalnie)" error={worldForm.formState.errors.slug?.message}>
                  <Input {...worldForm.register("slug")} />
                </Field>
                <Field label="Krótki opis" error={worldForm.formState.errors.summary?.message}>
                  <Textarea className="min-h-24" {...worldForm.register("summary")} />
                </Field>
                <Field label="Opis świata" error={worldForm.formState.errors.description?.message}>
                  <Textarea className="min-h-28" {...worldForm.register("description")} />
                </Field>
                <FormError message={worldMutation.isError ? getApiErrorMessage(worldMutation.error) : undefined} />
                <Button type="submit" disabled={worldMutation.isPending}>
                  {worldMutation.isPending ? "Zapisywanie..." : "Utwórz świat"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nowa statystyka</CardTitle>
              <CardDescription>
                Zdefiniuj pole liczbowe lub tekstowe, które pojawi się na kartach postaci.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={statForm.handleSubmit((values) => statMutation.mutate(values))}
              >
                <Field label="Świat" error={statForm.formState.errors.worldId?.message}>
                  <select
                    className="h-12 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
                    {...statForm.register("worldId")}
                  >
                    <option value="">Wybierz świat</option>
                    {worlds.map((world) => (
                      <option key={world.id} value={world.id}>
                        {world.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Klucz techniczny" error={statForm.formState.errors.key?.message}>
                  <Input placeholder="sila" {...statForm.register("key")} />
                </Field>
                <Field label="Nazwa widoczna" error={statForm.formState.errors.label?.message}>
                  <Input placeholder="Siła" {...statForm.register("label")} />
                </Field>
                <Field label="Opis" error={statForm.formState.errors.description?.message}>
                  <Textarea className="min-h-24" {...statForm.register("description")} />
                </Field>
                <Field label="Typ wartości" error={statForm.formState.errors.valueType?.message}>
                  <select
                    className="h-12 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
                    {...statForm.register("valueType")}
                  >
                    <option value="NUMBER">Liczba</option>
                    <option value="TEXT">Tekst</option>
                  </select>
                </Field>
                {selectedValueType === "NUMBER" ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Minimum" error={statForm.formState.errors.minValue?.message}>
                      <Input {...statForm.register("minValue")} />
                    </Field>
                    <Field label="Maksimum" error={statForm.formState.errors.maxValue?.message}>
                      <Input {...statForm.register("maxValue")} />
                    </Field>
                    <Field
                      label="Domyślna wartość"
                      error={statForm.formState.errors.defaultNumericValue?.message}
                    >
                      <Input {...statForm.register("defaultNumericValue")} />
                    </Field>
                  </div>
                ) : (
                  <Field
                    label="Domyślna wartość tekstowa"
                    error={statForm.formState.errors.defaultTextValue?.message}
                  >
                    <Input {...statForm.register("defaultTextValue")} />
                  </Field>
                )}
                <Field label="Pozycja" error={statForm.formState.errors.position?.message}>
                  <Input placeholder="0" {...statForm.register("position")} />
                </Field>
                <label className="flex items-center gap-3 rounded-2xl bg-[color:var(--surface)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                  <input
                    className="size-4 accent-[color:var(--accent)]"
                    type="checkbox"
                    {...statForm.register("isRequired")}
                  />
                  To pole jest wymagane przy tworzeniu postaci
                </label>
                <FormError message={statMutation.isError ? getApiErrorMessage(statMutation.error) : undefined} />
                <Button type="submit" disabled={statMutation.isPending || worlds.length === 0}>
                  {statMutation.isPending ? "Zapisywanie..." : "Dodaj statystykę"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-display text-3xl text-[color:var(--foreground)]">
              Propozycje umiejętności
            </h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-muted)]">
              Tutaj zatwierdzisz lub odrzucisz zgłoszenia przesłane przez graczy.
            </p>
          </div>
          {pendingProposals.length > 0 ? (
            <div className="grid gap-4">
              {pendingProposals.map((proposal) => (
                <SkillProposalReviewCard
                  proposal={proposal}
                  reviewComment={reviewComments[proposal.id] ?? ""}
                  reviewPending={reviewMutation.isPending}
                  onCommentChange={(value) =>
                    setReviewComments((current) => ({ ...current, [proposal.id]: value }))
                  }
                  onReview={(status) => reviewMutation.mutate({ proposalId: proposal.id, status })}
                  key={proposal.id}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-sm leading-7 text-[color:var(--foreground-muted)]">
                Brak propozycji oczekujących na review.
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-display text-3xl text-[color:var(--foreground)]">
              Skonfigurowane światy
            </h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-muted)]">
              To stąd formularze postaci pobierają dostępne zestawy statystyk.
            </p>
          </div>
          {worlds.length > 0 ? (
            <div className="grid gap-4">
              {worlds.map((world) => (
                <Card key={world.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{world.slug}</Badge>
                          <Badge>{world.statDefinitions.length} stat.</Badge>
                        </div>
                        <CardTitle className="mt-3 text-2xl">{world.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {world.summary ?? "Brak krótkiego opisu świata."}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {world.description ? (
                      <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                        {world.description}
                      </p>
                    ) : null}
                    {world.statDefinitions.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {world.statDefinitions.map((definition) => (
                          <div
                            className="rounded-[22px] bg-[color:var(--surface)] px-4 py-4"
                            key={definition.id}
                          >
                            <div className="flex flex-wrap gap-2">
                              <Badge>{definition.valueType === "NUMBER" ? "Liczba" : "Tekst"}</Badge>
                              {definition.isRequired ? <Badge>Wymagane</Badge> : null}
                            </div>
                            <p className="mt-3 text-lg font-semibold text-[color:var(--foreground)]">
                              {definition.label}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[color:var(--foreground-subtle)]">
                              {definition.key}
                            </p>
                            {definition.description ? (
                              <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-muted)]">
                                {definition.description}
                              </p>
                            ) : null}
                            {definition.valueType === "NUMBER" ? (
                              <p className="mt-3 text-sm text-[color:var(--foreground-muted)]">
                                Zakres: {definition.minValue ?? "brak"} - {definition.maxValue ?? "brak"}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[color:var(--foreground-muted)]">
                        Ten świat nie ma jeszcze żadnych statystyk.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-sm leading-7 text-[color:var(--foreground-muted)]">
                Nie dodano jeszcze żadnego świata. Zacznij od pierwszego formularza powyżej.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function SkillProposalReviewCard({
  proposal,
  reviewComment,
  reviewPending,
  onCommentChange,
  onReview,
}: {
  proposal: SkillProposal;
  reviewComment: string;
  reviewPending: boolean;
  onCommentChange: (value: string) => void;
  onReview: (status: SkillProposalStatus) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>Oczekuje</Badge>
              <Badge>{proposal.character.name}</Badge>
              <Badge>{new Date(proposal.createdAt).toLocaleDateString("pl-PL")}</Badge>
            </div>
            <CardTitle className="mt-3 text-2xl">{proposal.name}</CardTitle>
            <CardDescription className="mt-2">
              Autor: {proposal.proposer.displayName || proposal.proposer.username}
            </CardDescription>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/character/${proposal.characterId}`}>Karta postaci</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
          {proposal.description}
        </p>
        {proposal.mechanics ? (
          <p className="text-sm text-[color:var(--foreground-muted)]">
            <strong className="text-[color:var(--foreground)]">Mechanika:</strong> {proposal.mechanics}
          </p>
        ) : null}
        {proposal.costs ? (
          <p className="text-sm text-[color:var(--foreground-muted)]">
            <strong className="text-[color:var(--foreground)]">Koszty:</strong> {proposal.costs}
          </p>
        ) : null}
        {proposal.limitations ? (
          <p className="text-sm text-[color:var(--foreground-muted)]">
            <strong className="text-[color:var(--foreground)]">Ograniczenia:</strong> {proposal.limitations}
          </p>
        ) : null}
        <div>
          <Label>Komentarz do decyzji</Label>
          <Textarea
            className="min-h-24"
            value={reviewComment}
            onChange={(event) => onCommentChange(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={reviewPending}
            onClick={() => onReview("APPROVED")}
          >
            {reviewPending ? "Zapisywanie..." : "Zatwierdź"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={reviewPending}
            onClick={() => onReview("REJECTED")}
          >
            Odrzuć
          </Button>
        </div>
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

function toOptionalNumber(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return Number(trimmed);
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
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
