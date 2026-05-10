"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage, getCurrentUser, getWorlds } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function WorldsShell() {
  const router = useRouter();
  const { accessToken, hydrated, user, setUser, clearSession } = useAuthStore((state) => state);

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const worldsQuery = useQuery({
    queryKey: ["worlds"],
    queryFn: getWorlds,
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

  if (!hydrated || currentUserQuery.isLoading || worldsQuery.isLoading) {
    return <WorldsSkeleton />;
  }

  if (!accessToken) {
    return null;
  }

  const currentUser = currentUserQuery.data?.user ?? user;
  const canManageWorlds = currentUser?.role === "GM" || currentUser?.role === "ADMIN";
  const worlds = worldsQuery.data?.worlds ?? [];
  const totalStatDefinitions = worlds.reduce(
    (sum, world) => sum + world.statDefinitions.length,
    0,
  );

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>Swiaty</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  Atlas swiatow i WorldLog
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  Wybierz swiat, aby przejrzec jego wpisy fabularne i kronike najwazniejszych
                  wydarzen.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {canManageWorlds ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/mg">Panel MG</Link>
                </Button>
              ) : null}
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Dashboard</Link>
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

        <section className="grid gap-6 lg:grid-cols-3">
          <SummaryCard
            label="Aktywne swiaty"
            value={String(worlds.length)}
            description="Swiaty dostepne dla kart postaci oraz nowych wpisow WorldLog."
          />
          <SummaryCard
            label="Definicje statystyk"
            value={String(totalStatDefinitions)}
            description="Laczna liczba skonfigurowanych pol postaci we wszystkich swiatach."
          />
          <SummaryCard
            label="Dostep WorldLog"
            value={canManageWorlds ? "GM/Admin" : "Odczyt"}
            description="GM i administrator moga dodawac wpisy, pozostali uzytkownicy je przegladaja."
          />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-display text-3xl text-[color:var(--foreground)]">Lista swiatow</h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-muted)]">
              Kazdy swiat prowadzi osobny WorldLog z prostymi wpisami fabularnymi.
            </p>
          </div>
          {worlds.length > 0 ? (
            <div className="grid gap-4">
              {worlds.map((world) => (
                <Card key={world.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{world.slug}</Badge>
                          <Badge>{world.statDefinitions.length} stat.</Badge>
                        </div>
                        <CardTitle className="mt-3 text-2xl">{world.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {world.summary ?? "Brak krotkiego opisu swiata."}
                        </CardDescription>
                      </div>
                      <Button asChild variant="secondary">
                        <Link href={`/worlds/${world.id}`}>Otworz WorldLog</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                      {world.description ?? "Ten swiat nie ma jeszcze rozwinietego opisu."}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-sm leading-7 text-[color:var(--foreground-muted)]">
                Nie dodano jeszcze zadnego swiata. W panelu MG mozesz utworzyc pierwszy wpis.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
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

function WorldsSkeleton() {
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
