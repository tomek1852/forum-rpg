"use client";

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
import { getApiErrorMessage, getCharacterRankings, getWorlds } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function RankingsShell() {
  const router = useRouter();
  const [selectedWorldId, setSelectedWorldId] = useState("");
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
    queryKey: ["character-rankings", selectedWorldId || "all"],
    queryFn: () => getCharacterRankings(selectedWorldId || undefined),
    enabled: hydrated && Boolean(accessToken),
  });

  if (!hydrated || (accessToken && (worldsQuery.isLoading || rankingsQuery.isLoading))) {
    return <RankingsSkeleton />;
  }

  if (!accessToken) {
    return null;
  }

  const worlds = worldsQuery.data?.worlds ?? [];
  const rankings = rankingsQuery.data?.rankings ?? [];
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
                  Ranking postaci
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  Zobacz aktualna kolejnosc postaci wedlug EXP i PH, z mozliwoscia
                  zawzenia widoku do wybranego swiata.
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

        <section className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
          <Card>
            <CardHeader>
              <CardTitle>Filtry rankingu</CardTitle>
              <CardDescription>
                Wybierz swiat, aby pokazac tylko postacie z jednej rozgrywki.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-[color:var(--foreground)]"
                  htmlFor="rankings-world"
                >
                  Swiat
                </label>
                <select
                  className="h-12 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
                  id="rankings-world"
                  value={selectedWorldId}
                  onChange={(event) => setSelectedWorldId(event.target.value)}
                >
                  <option value="">Wszystkie swiaty</option>
                  {worlds.map((world) => (
                    <option key={world.id} value={world.id}>
                      {world.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-[24px] bg-[color:var(--surface)] p-4 text-sm leading-6 text-[color:var(--foreground-muted)]">
                {selectedWorld
                  ? `Aktywny filtr: ${selectedWorld.name}.`
                  : "Pokazujesz laczny ranking ze wszystkich swiatow."}
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
              <CardTitle>Aktualna tabela</CardTitle>
              <CardDescription>
                Kolejnosc jest liczona wedlug malejacego EXP, a potem malejacego PH.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rankings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">
                        <th className="px-3 py-2">Pozycja</th>
                        <th className="px-3 py-2">Postac</th>
                        <th className="px-3 py-2">Swiat</th>
                        <th className="px-3 py-2">EXP</th>
                        <th className="px-3 py-2">PH</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((entry) => (
                        <tr
                          className="rounded-[22px] bg-[color:var(--surface)] text-sm text-[color:var(--foreground)]"
                          key={entry.characterId}
                        >
                          <td className="rounded-l-[22px] px-3 py-4 font-semibold">
                            #{entry.position}
                          </td>
                          <td className="px-3 py-4">
                            <Link
                              className="font-semibold text-[color:var(--accent-strong)]"
                              href={`/character/${entry.characterId}`}
                            >
                              {entry.name}
                            </Link>
                          </td>
                          <td className="px-3 py-4 text-[color:var(--foreground-muted)]">
                            {entry.world?.name ?? "Bez swiata"}
                          </td>
                          <td className="px-3 py-4 font-semibold">{entry.experiencePoints}</td>
                          <td className="rounded-r-[22px] px-3 py-4 font-semibold">
                            {entry.heroPoints}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm leading-6 text-[color:var(--foreground-muted)]">
                  Brak postaci spelniajacych wybrane kryteria rankingu.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

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
