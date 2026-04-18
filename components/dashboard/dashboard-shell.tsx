"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CharacterCard } from "@/components/characters/character-card";
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
  getCurrentUser,
  getApiErrorMessage,
  getMyCharacters,
  logoutUser,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function DashboardShell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, refreshToken, hydrated, user, setUser, clearSession } =
    useAuthStore((state) => state);

  const profileQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });
  const charactersQuery = useQuery({
    queryKey: ["my-characters"],
    queryFn: getMyCharacters,
    enabled: hydrated && Boolean(accessToken),
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
    if (profileQuery.data?.user) {
      setUser(profileQuery.data.user);
    }
  }, [profileQuery.data, setUser]);

  useEffect(() => {
    if (profileQuery.isError) {
      clearSession();
      router.replace("/login");
    }
  }, [clearSession, profileQuery.isError, router]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!refreshToken) {
        return { message: "Sesja lokalna została zamknięta." };
      }

      return logoutUser(refreshToken);
    },
    onSettled: async () => {
      clearSession();
      await queryClient.cancelQueries();
      queryClient.clear();
      router.replace("/login");
    },
  });

  if (!hydrated || (accessToken && (profileQuery.isLoading || charactersQuery.isLoading))) {
    return (
      <div className="min-h-screen px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-12 w-72 rounded-full bg-[color:var(--surface-strong)]" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-48 rounded-[28px] bg-[color:var(--surface-strong)]" />
            <div className="h-48 rounded-[28px] bg-[color:var(--surface-strong)]" />
            <div className="h-48 rounded-[28px] bg-[color:var(--surface-strong)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  const profile = profileQuery.data?.user ?? user;
  const characters = charactersQuery.data?.characters ?? [];

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>Dashboard</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  Witaj, {profile?.username ?? "Graczu"}
                </h1>
                <p className="mt-3 max-w-2xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  Tu zarządzisz swoim kontem, przejdziesz do profilu i przygotujesz postacie do dalszej rozgrywki.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/forum">Forum</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/notifications">Powiadomienia</Link>
              </Button>
              {profile ? (
                <Button asChild size="lg">
                  <Link href={`/profile/${profile.id}`}>Mój profil</Link>
                </Button>
              ) : null}
              <Button
                size="lg"
                variant="secondary"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Wylogowywanie..." : "Wyloguj się"}
              </Button>
            </div>
          </div>
        </header>
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Profil gracza</CardTitle>
              <CardDescription>
                Najważniejsze dane zwracane przez backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[color:var(--foreground-muted)]">
              <ProfileRow label="E-mail" value={profile?.email ?? "-"} />
              <ProfileRow label="Nazwa" value={profile?.username ?? "-"} />
              <ProfileRow label="Rola" value={profile?.role ?? "-"} />
              <ProfileRow
                label="Utworzono"
                value={
                  profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("pl-PL")
                    : "-"
                }
              />
            </CardContent>
          </Card>
        </section>
        <section className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Moje postacie</CardTitle>
                  <CardDescription>
                    Tutaj zobaczysz swoje karty i szybko przejdziesz do ich edycji.
                  </CardDescription>
                </div>
                <Button asChild variant="secondary">
                  <Link href="/character/new">Dodaj postać</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {characters.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {characters.map((character) => (
                    <CharacterCard character={character} editable key={character.id} />
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-[color:var(--foreground-muted)]">
                  Nie masz jeszcze żadnej postaci. Utwórz pierwszą kartę i uzupełnij jej opis oraz statystyki.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
        {profileQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">
            {getApiErrorMessage(profileQuery.error)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-[color:var(--surface)] px-4 py-3">
      <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--foreground-subtle)]">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-[color:var(--foreground)]">
        {value}
      </div>
    </div>
  );
}
