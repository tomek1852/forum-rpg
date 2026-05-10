"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage, getCharacter, getCharacterProgress } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { CharacterSkill, ProgressEntry, SkillProposal, SkillProposalStatus } from "@/lib/types";
import { ProgressGrantForm } from "./progress-grant-form";
import { SkillProposalForm } from "./skill-proposal-form";

export function CharacterDetailShell({ characterId }: { characterId: string }) {
  const router = useRouter();
  const { accessToken, hydrated, user } = useAuthStore((state) => state);

  const query = useQuery({
    queryKey: ["character", characterId],
    queryFn: () => getCharacter(characterId),
    enabled: hydrated && Boolean(accessToken),
  });

  const progressQuery = useQuery({
    queryKey: ["character-progress", characterId],
    queryFn: () => getCharacterProgress(characterId),
    enabled:
      hydrated &&
      Boolean(accessToken) &&
      Boolean(user) &&
      Boolean(query.data?.character) &&
      (user?.role === "GM" ||
        user?.role === "ADMIN" ||
        user?.id === query.data?.character.ownerId),
    retry: false,
  });

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hydrated, router]);

  if (!hydrated || query.isLoading) {
    return <PageSkeleton />;
  }

  if (!accessToken || !query.data) {
    return null;
  }

  const character = query.data.character;
  const isOwner = user?.id === character.ownerId;
  const canReviewSkills = user?.role === "GM" || user?.role === "ADMIN";
  const canManageProgress = canReviewSkills;
  const canViewProgress = isOwner || canManageProgress;
  const stats =
    character.statValues.length > 0
      ? character.statValues.map((statValue) => ({
          key: statValue.statDefinition.key,
          label: statValue.statDefinition.label,
          value:
            statValue.numericValue !== null
              ? String(statValue.numericValue)
              : (statValue.textValue ?? ""),
        }))
      : Object.entries(character.statsJson ?? {}).map(([key, value]) => ({
          key,
          label: key,
          value: String(value),
        }));

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>{character.isPublic ? "Postać publiczna" : "Postać prywatna"}</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  {character.name}
                </h1>
                <p className="mt-2 text-lg text-[color:var(--foreground-muted)]">
                  {character.title ?? "Brak tytułu lub roli."}
                </p>
                <p className="mt-2 text-sm uppercase tracking-[0.24em] text-[color:var(--foreground-subtle)]">
                  {character.world?.name ?? "Brak przypisanego świata"}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <ProgressBadge label="EXP" value={character.experiencePoints} />
                <ProgressBadge label="PH" value={character.heroPoints} />
              </div>
              <div className="flex gap-3">
                {isOwner ? (
                  <Button asChild size="lg" variant="secondary">
                    <Link href={`/character/${character.id}/edit`}>Edytuj</Link>
                  </Button>
                ) : null}
                <Button asChild size="lg">
                  <Link href={`/profile/${character.ownerId}`}>Profil gracza</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Opis postaci</CardTitle>
              <CardDescription>{character.summary ?? "Brak skrótu opisu."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <section>
                <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Biografia</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
                  {character.biography ?? "Biografia nie została jeszcze uzupełniona."}
                </p>
              </section>
              <section>
                <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Wygląd</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
                  {character.appearance ?? "Opis wyglądu nie został jeszcze uzupełniony."}
                </p>
              </section>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statystyki</CardTitle>
              <CardDescription>
                Zestaw wynikający z definicji statystyk przypisanych do świata postaci.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.length > 0 ? (
                stats.map((stat) => (
                  <div
                    className="rounded-[22px] bg-[color:var(--surface)] px-4 py-3"
                    key={stat.key}
                  >
                    <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--foreground-subtle)]">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-base font-semibold text-[color:var(--foreground)]">
                      {stat.value}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[color:var(--foreground-muted)]">
                  Ta postać nie ma jeszcze zapisanych statystyk.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {canViewProgress ? (
          <section
            className={`grid gap-6 ${canManageProgress ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}
          >
            {canManageProgress ? (
              <Card>
                <CardHeader>
                  <CardTitle>Przyznaj progres</CardTitle>
                  <CardDescription>
                    Dodaj punkty EXP lub PH. Liczniki postaci zaktualizują się automatycznie.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProgressGrantForm characterId={character.id} />
                </CardContent>
              </Card>
            ) : null}
            <ProgressHistoryCard
              entries={progressQuery.data?.entries ?? []}
              isLoading={progressQuery.isLoading}
              error={progressQuery.isError ? getApiErrorMessage(progressQuery.error) : undefined}
            />
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Umiejętności postaci</CardTitle>
              <CardDescription>
                Zatwierdzone umiejętności, które są już częścią karty postaci.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {character.skills.length > 0 ? (
                character.skills.map((skill) => <SkillCard skill={skill} key={skill.id} />)
              ) : (
                <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                  Ta postać nie ma jeszcze zatwierdzonych umiejętności.
                </p>
              )}
            </CardContent>
          </Card>

          {isOwner ? (
            <Card>
              <CardHeader>
                <CardTitle>Nowa propozycja umiejętności</CardTitle>
                <CardDescription>
                  Opisz pomysł, mechanikę i ograniczenia. Propozycja trafi do review MG.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SkillProposalForm characterId={character.id} />
              </CardContent>
            </Card>
          ) : null}
        </section>

        {character.skillProposals.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {canReviewSkills && !isOwner
                  ? "Propozycje umiejętności do wglądu"
                  : "Twoje propozycje umiejętności"}
              </CardTitle>
              <CardDescription>
                Historia zgłoszeń związanych z tą postacią i ich aktualny status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {character.skillProposals.map((proposal) => (
                <ProposalCard proposal={proposal} key={proposal.id} />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {query.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(query.error)}</p>
        ) : null}
      </div>
    </div>
  );
}

function ProgressBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-white/70 px-5 py-4 text-center">
      <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--foreground-subtle)]">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl text-[color:var(--foreground)]">{value}</div>
    </div>
  );
}

function ProgressHistoryCard({
  entries,
  isLoading,
  error,
}: {
  entries: ProgressEntry[];
  isLoading: boolean;
  error?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historia progresu</CardTitle>
        <CardDescription>Ostatnie przyznane punkty EXP i PH dla tej postaci.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-[color:var(--foreground-muted)]">Ładowanie historii...</p>
        ) : null}
        {error ? <p className="text-sm text-[#9d3d2d]">{error}</p> : null}
        {!isLoading && !error && entries.length === 0 ? (
          <p className="text-sm text-[color:var(--foreground-muted)]">
            Ta postać nie ma jeszcze wpisów progresu.
          </p>
        ) : null}
        {entries.map((entry) => (
          <div className="rounded-[22px] bg-[color:var(--surface)] px-4 py-3" key={entry.id}>
            <div className="flex flex-wrap gap-2">
              {entry.expDelta > 0 ? <Badge>+{entry.expDelta} EXP</Badge> : null}
              {entry.phDelta > 0 ? <Badge>+{entry.phDelta} PH</Badge> : null}
              <Badge>{new Date(entry.createdAt).toLocaleDateString("pl-PL")}</Badge>
            </div>
            <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
              {entry.reason}
            </p>
            {entry.note ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[color:var(--foreground-muted)]">
                {entry.note}
              </p>
            ) : null}
            {entry.grantedBy ? (
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">
                Przyznał: {entry.grantedBy.displayName || entry.grantedBy.username}
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SkillCard({ skill }: { skill: CharacterSkill }) {
  return (
    <div className="rounded-[24px] bg-[color:var(--surface)] p-5">
      <div className="flex flex-wrap gap-2">
        <Badge>Zatwierdzona</Badge>
        <Badge>{new Date(skill.grantedAt).toLocaleDateString("pl-PL")}</Badge>
      </div>
      <h3 className="mt-3 text-xl font-semibold text-[color:var(--foreground)]">{skill.name}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
        {skill.description}
      </p>
      {skill.mechanics ? (
        <p className="mt-3 text-sm text-[color:var(--foreground-muted)]">
          <strong className="text-[color:var(--foreground)]">Mechanika:</strong> {skill.mechanics}
        </p>
      ) : null}
      {skill.costs ? (
        <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
          <strong className="text-[color:var(--foreground)]">Koszty:</strong> {skill.costs}
        </p>
      ) : null}
      {skill.limitations ? (
        <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
          <strong className="text-[color:var(--foreground)]">Ograniczenia:</strong> {skill.limitations}
        </p>
      ) : null}
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: SkillProposal }) {
  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-white p-5">
      <div className="flex flex-wrap gap-2">
        <Badge>{formatProposalStatus(proposal.status)}</Badge>
        <Badge>{new Date(proposal.createdAt).toLocaleDateString("pl-PL")}</Badge>
      </div>
      <h3 className="mt-3 text-xl font-semibold text-[color:var(--foreground)]">{proposal.name}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-muted)]">
        {proposal.description}
      </p>
      {proposal.mechanics ? (
        <p className="mt-3 text-sm text-[color:var(--foreground-muted)]">
          <strong className="text-[color:var(--foreground)]">Mechanika:</strong> {proposal.mechanics}
        </p>
      ) : null}
      {proposal.costs ? (
        <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
          <strong className="text-[color:var(--foreground)]">Koszty:</strong> {proposal.costs}
        </p>
      ) : null}
      {proposal.limitations ? (
        <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
          <strong className="text-[color:var(--foreground)]">Ograniczenia:</strong> {proposal.limitations}
        </p>
      ) : null}
      {proposal.reviewerComment ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-[color:var(--foreground-muted)]">
          <strong className="text-[color:var(--foreground)]">Komentarz MG:</strong>{" "}
          {proposal.reviewerComment}
        </p>
      ) : null}
    </div>
  );
}

function formatProposalStatus(status: SkillProposalStatus) {
  switch (status) {
    case "APPROVED":
      return "Zatwierdzona";
    case "REJECTED":
      return "Odrzucona";
    default:
      return "Oczekuje";
  }
}

function PageSkeleton() {
  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-5xl animate-pulse space-y-6">
        <div className="h-48 rounded-[36px] bg-[color:var(--surface-strong)]" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-72 rounded-[28px] bg-[color:var(--surface-strong)]" />
          <div className="h-72 rounded-[28px] bg-[color:var(--surface-strong)]" />
        </div>
      </div>
    </div>
  );
}
