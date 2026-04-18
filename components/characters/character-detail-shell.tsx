"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage, getCharacter } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function CharacterDetailShell({ characterId }: { characterId: string }) {
  const router = useRouter();
  const { accessToken, hydrated, user } = useAuthStore((state) => state);

  const query = useQuery({
    queryKey: ["character", characterId],
    queryFn: () => getCharacter(characterId),
    enabled: hydrated && Boolean(accessToken),
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
  const stats = Object.entries(character.statsJson ?? {});

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
              </div>
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
              <CardDescription>Dowolne pola JSON zapisane dla postaci.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.length > 0 ? (
                stats.map(([key, value]) => (
                  <div
                    className="rounded-[22px] bg-[color:var(--surface)] px-4 py-3"
                    key={key}
                  >
                    <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--foreground-subtle)]">
                      {key}
                    </div>
                    <div className="mt-1 text-base font-semibold text-[color:var(--foreground)]">
                      {String(value)}
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
        {query.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(query.error)}</p>
        ) : null}
      </div>
    </div>
  );
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
