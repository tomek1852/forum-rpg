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
        return { message: "Sesja lokalna zostala zamknieta." };
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
                  Tu zarzadzisz swoim kontem, przejdziesz do profilu i przygotujesz postacie do dalszej rozgrywki.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {profile ? (
                <Button asChild size="lg">
                  <Link href={`/profile/${profile.id}`}>Moj profil</Link>
                </Button>
              ) : null}
              <Button
                size="lg"
                variant="secondary"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Wylogowywanie..." : "Wyloguj sie"}
              </Button>
            </div>
          </div>
        </header>
        <section className="grid gap-6 lg:grid-cols-3">
          <InfoCard
            title="Status sesji"
            value="Aktywny"
            description="Chroniony endpoint /auth/me potwierdza dostep do panelu."
          />
          <InfoCard
            title="Rola"
            value={profile?.role ?? "PLAYER"}
            description="Panel pokazuje Twoje aktualne uprawnienia w serwisie."
          />
          <InfoCard
            title="Dalej"
            value="Postacie"
            description="Z tego miejsca przejdziesz prosto do profilu i swoich kart postaci."
          />
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>To konto jest gotowe do gry</CardTitle>
              <CardDescription>
                Najwazniejsze elementy dostepu do konta dzialaja i sa gotowe do testowania.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <ChecklistItem
                title="Rejestracja"
                description="Nowe konto prowadzi przez podstawowy proces wejscia do serwisu."
              />
              <ChecklistItem
                title="Logowanie"
                description="Do panelu wejdziesz po swoich danych konta."
              />
              <ChecklistItem
                title="Reset hasla"
                description="Mozesz odzyskac dostep do konta, gdy zapomnisz hasla."
              />
              <ChecklistItem
                title="Refresh sesji"
                description="Sesja utrzymuje dostep do panelu bez zbednego przerywania pracy."
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Profil gracza</CardTitle>
              <CardDescription>
                Najwazniejsze dane zwracane przez backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[color:var(--foreground-muted)]">
              <ProfileRow label="Email" value={profile?.email ?? "-"} />
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
                  <Link href="/character/new">Dodaj postac</Link>
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
                  Nie masz jeszcze zadnej postaci. Utworz pierwsza karte i uzupelnij jej opis oraz statystyki.
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

function InfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-[color:var(--foreground-muted)]">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function ChecklistItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] bg-[color:var(--surface)] p-5">
      <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-muted)]">
        {description}
      </p>
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
