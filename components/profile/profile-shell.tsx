"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CharacterCard } from "@/components/characters/character-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getApiErrorMessage,
  getCharactersByUser,
  getCurrentUser,
  getMyCharacters,
  getUserProfile,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { ProfileForm } from "./profile-form";

export function ProfileShell({ userId }: { userId: string }) {
  const router = useRouter();
  const { accessToken, hydrated, user, setUser, clearSession } = useAuthStore(
    (state) => state,
  );

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });
  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: hydrated && Boolean(accessToken),
  });
  const charactersQuery = useQuery({
    queryKey: ["profile-characters", userId],
    queryFn: async () => {
      const currentUserId = currentUserQuery.data?.user.id ?? user?.id;

      if (currentUserId === userId) {
        return getMyCharacters();
      }

      return getCharactersByUser(userId);
    },
    enabled: hydrated && Boolean(accessToken) && !currentUserQuery.isLoading,
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
    if (profileQuery.isError && profileQuery.error) {
      const status = (profileQuery.error as { response?: { status?: number } }).response?.status;

      if (status === 401) {
        clearSession();
        router.replace("/login");
      }
    }
  }, [clearSession, profileQuery.error, profileQuery.isError, router]);

  if (
    !hydrated ||
    currentUserQuery.isLoading ||
    profileQuery.isLoading ||
    charactersQuery.isLoading
  ) {
    return <ProfileSkeleton />;
  }

  if (!accessToken || !profileQuery.data) {
    return null;
  }

  const profile = profileQuery.data.user;
  const currentUser = currentUserQuery.data?.user ?? user;
  const isOwnProfile = currentUser?.id === profile.id;
  const characters = charactersQuery.data?.characters ?? [];

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>{profile.role}</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  {profile.displayName || profile.username}
                </h1>
                <p className="mt-2 max-w-2xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  {profile.bio || "Profil gracza jest gotowy, ale czeka jeszcze na bardziej szczegolowy opis."}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {isOwnProfile ? (
                <Button asChild size="lg">
                  <Link href="/character/new">Nowa postac</Link>
                </Button>
              ) : null}
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </header>
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>
                Status: {profile.status}. Email zweryfikowany: {profile.emailVerified ? "tak" : "nie"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[color:var(--foreground-muted)]">
              <ProfileRow label="Login" value={profile.username} />
              <ProfileRow label="Email" value={profile.email} />
              <ProfileRow
                label="Ostatnio widziany"
                value={
                  profile.lastSeenAt
                    ? new Date(profile.lastSeenAt).toLocaleString("pl-PL")
                    : "Brak danych"
                }
              />
              {isOwnProfile ? <ProfileForm user={profile} /> : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Postacie gracza</CardTitle>
              <CardDescription>
                {characters.length > 0
                  ? "Aktualna lista postaci nalezacych do tego profilu."
                  : "Ten profil nie ma jeszcze publicznych postaci."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {characters.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {characters.map((character) => (
                    <CharacterCard
                      character={character}
                      editable={isOwnProfile}
                      key={character.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-[color:var(--foreground-muted)]">
                  Dodaj pierwsza postac z tego profilu, aby rozpoczac watek fabularny i przygotowac sie pod forum.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
        {profileQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(profileQuery.error)}</p>
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

function ProfileSkeleton() {
  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-44 rounded-[36px] bg-[color:var(--surface-strong)]" />
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="h-72 rounded-[28px] bg-[color:var(--surface-strong)]" />
          <div className="h-72 rounded-[28px] bg-[color:var(--surface-strong)]" />
        </div>
      </div>
    </div>
  );
}
