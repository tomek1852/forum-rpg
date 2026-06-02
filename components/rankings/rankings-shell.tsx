"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import {
  getApiErrorMessage,
  getCharacterRankings,
  getWorldRankings,
  getWorlds,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { CharacterRankingEntry } from "@/lib/types";

type Tab = "characters" | "worlds";
type SortBy = "exp" | "heroPoints" | "skillsCount" | "createdAt";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "exp", label: "EXP (malejąco)" },
  { value: "heroPoints", label: "PH (malejąco)" },
  { value: "skillsCount", label: "Liczba umiejętności" },
  { value: "createdAt", label: "Data utworzenia" },
];

export function RankingsShell() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("characters");
  const [selectedWorldId, setSelectedWorldId] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("exp");
  const { accessToken, hydrated } = useAuthStore((state) => state);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hydrated, router]);

  const worldsQuery = useQuery({
    queryKey: ["worlds"],
    queryFn: getWorlds,
    enabled: hydrated && Boolean(accessToken),
  });

  const rankingsQuery = useQuery({
    queryKey: ["character-rankings", selectedWorldId || "all", sortBy],
    queryFn: () =>
      getCharacterRankings({
        worldId: selectedWorldId || undefined,
        sortBy,
        limit: 50,
      }),
    enabled: hydrated && Boolean(accessToken) && activeTab === "characters",
  });

  const worldRankingsQuery = useQuery({
    queryKey: ["world-rankings"],
    queryFn: getWorldRankings,
    enabled: hydrated && Boolean(accessToken) && activeTab === "worlds",
  });

  if (!hydrated || (accessToken && worldsQuery.isLoading)) {
    return <RankingsSkeleton />;
  }

  if (!accessToken) {
    return null;
  }

  const worlds = worldsQuery.data?.worlds ?? [];
  const rankings = rankingsQuery.data?.rankings ?? [];
  const worldRankings = worldRankingsQuery.data?.worlds ?? [];
  const selectedWorld = worlds.find((world) => world.id === selectedWorldId) ?? null;

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>Ranking</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  Leaderboard
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  Ranking postaci i światów według EXP, PH oraz aktywności.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/forum">Forum</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "characters"
                ? "bg-[color:var(--accent)] text-white"
                : "bg-[color:var(--surface)] text-[color:var(--foreground-muted)] hover:text-[color:var(--foreground)]"
            }`}
            onClick={() => setActiveTab("characters")}
          >
            Postacie
          </button>
          <button
            className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "worlds"
                ? "bg-[color:var(--accent)] text-white"
                : "bg-[color:var(--surface)] text-[color:var(--foreground-muted)] hover:text-[color:var(--foreground)]"
            }`}
            onClick={() => setActiveTab("worlds")}
          >
            Światy
          </button>
        </div>

        {activeTab === "characters" && (
          <section className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
            <Card>
              <CardHeader>
                <CardTitle>Filtry rankingu</CardTitle>
                <CardDescription>
                  Wybierz świat i kryterium sortowania.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-[color:var(--foreground)]"
                    htmlFor="rankings-world"
                  >
                    Świat
                  </label>
                  <select
                    className="h-12 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
                    id="rankings-world"
                    value={selectedWorldId}
                    onChange={(event) => setSelectedWorldId(event.target.value)}
                  >
                    <option value="">Wszystkie światy</option>
                    {worlds.map((world) => (
                      <option key={world.id} value={world.id}>
                        {world.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-[color:var(--foreground)]"
                    htmlFor="rankings-sort"
                  >
                    Sortowanie
                  </label>
                  <select
                    className="h-12 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
                    id="rankings-sort"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortBy)}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard label="Postacie" value={String(rankings.length)} />
                  <MetricCard
                    label="Zakres"
                    value={selectedWorld ? selectedWorld.slug : "all"}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tabela rankingowa</CardTitle>
                <CardDescription>
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "EXP (malejąco)"}
                  {selectedWorld ? ` • ${selectedWorld.name}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rankingsQuery.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-[22px] bg-[color:var(--surface-strong)]" />
                    ))}
                  </div>
                ) : rankings.length > 0 ? (
                  <CharacterTable rankings={rankings} />
                ) : (
                  <p className="text-sm leading-6 text-[color:var(--foreground-muted)]">
                    Brak postaci spełniających wybrane kryteria rankingu.
                  </p>
                )}
              </CardContent>
            </Card>

            {rankingsQuery.data?.nextCursor && (
              <div className="lg:col-start-2 flex justify-center">
                <p className="text-sm text-[color:var(--foreground-muted)]">
                  Wyświetlono pierwsze 50 wyników. Użyj filtrów, aby zawęzić widok.
                </p>
              </div>
            )}
          </section>
        )}

        {activeTab === "worlds" && (
          <Card>
            <CardHeader>
              <CardTitle>Statystyki światów</CardTitle>
              <CardDescription>
                Liczba aktywnych postaci, suma EXP i data ostatniej aktywności per świat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {worldRankingsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-[22px] bg-[color:var(--surface-strong)]" />
                  ))}
                </div>
              ) : worldRankings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Świat</th>
                        <th className="px-3 py-2">Postacie</th>
                        <th className="px-3 py-2">Suma EXP</th>
                        <th className="px-3 py-2">Ostatnia aktywność</th>
                      </tr>
                    </thead>
                    <tbody>
                      {worldRankings
                        .slice()
                        .sort((a, b) => b.totalExp - a.totalExp)
                        .map((world, index) => (
                          <tr
                            className="rounded-[22px] bg-[color:var(--surface)] text-sm text-[color:var(--foreground)]"
                            key={world.worldId}
                          >
                            <td className="rounded-l-[22px] px-3 py-4 font-semibold text-[color:var(--foreground-subtle)]">
                              #{index + 1}
                            </td>
                            <td className="px-3 py-4">
                              <span className="font-semibold">{world.name}</span>
                              <span className="ml-2 text-xs text-[color:var(--foreground-muted)]">
                                {world.slug}
                              </span>
                            </td>
                            <td className="px-3 py-4">{world.activeCharacterCount}</td>
                            <td className="px-3 py-4 font-semibold">{world.totalExp}</td>
                            <td className="rounded-r-[22px] px-3 py-4 text-[color:var(--foreground-muted)]">
                              {world.lastActivityAt
                                ? new Date(world.lastActivityAt).toLocaleDateString("pl-PL")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm leading-6 text-[color:var(--foreground-muted)]">
                  Brak aktywnych światów.
                </p>
              )}
              {worldRankingsQuery.isError && (
                <p className="text-sm text-[#9d3d2d]">
                  {getApiErrorMessage(worldRankingsQuery.error)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {worldsQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(worldsQuery.error)}</p>
        ) : null}
        {rankingsQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(rankingsQuery.error)}</p>
        ) : null}
      </div>
    </div>
  );
}

function CharacterTable({
  rankings,
}: {
  rankings: CharacterRankingEntry[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">
            <th className="px-3 py-2">Pozycja</th>
            <th className="px-3 py-2">Postać</th>
            <th className="px-3 py-2">Świat</th>
            <th className="px-3 py-2">EXP</th>
            <th className="px-3 py-2">PH</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((entry) => {
            return (
              <tr
                className="rounded-[22px] bg-[color:var(--surface)] text-sm text-[color:var(--foreground)] transition"
                key={entry.characterId}
              >
                <td className="rounded-l-[22px] px-3 py-4 font-semibold text-[color:var(--foreground-subtle)]">
                  #{entry.position}
                </td>
                <td className="px-3 py-4">
                  <div className="flex items-center gap-3">
                    {entry.avatarUrl ? (
                      <Image
                        alt={entry.name}
                        className="h-8 w-8 rounded-full object-cover"
                        height={32}
                        src={entry.avatarUrl}
                        width={32}
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--surface-strong)] text-xs font-bold text-[color:var(--foreground-muted)]">
                        {entry.name[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <Link
                      className="font-semibold text-[color:var(--accent-strong)] hover:underline"
                      href={`/character/${entry.characterId}`}
                    >
                      {entry.name}
                    </Link>
                  </div>
                </td>
                <td className="px-3 py-4 text-[color:var(--foreground-muted)]">
                  {entry.world?.name ?? "Bez świata"}
                </td>
                <td className="px-3 py-4 font-semibold">{entry.experiencePoints}</td>
                <td className="rounded-r-[22px] px-3 py-4 font-semibold">{entry.heroPoints}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-[color:var(--surface)] px-4 py-3">
      <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--foreground-subtle)]">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-[color:var(--foreground)]">{value}</div>
    </div>
  );
}

function RankingsSkeleton() {
  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-48 rounded-[36px] bg-[color:var(--surface-strong)]" />
        <div className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
          <div className="h-80 rounded-[28px] bg-[color:var(--surface-strong)]" />
          <div className="h-80 rounded-[28px] bg-[color:var(--surface-strong)]" />
        </div>
      </div>
    </div>
  );
}
