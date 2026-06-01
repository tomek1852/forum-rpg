"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAdminUserActivity,
  getCurrentUser,
  getCharactersByUser,
  getModerationReports,
  getUserProfile,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function AdminUserDetail({ userId }: { userId: string }) {
  const router = useRouter();
  const { accessToken, hydrated, user, setUser, clearSession } = useAuthStore(
    (state) => state,
  );

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const currentUser = currentUserQuery.data?.user ?? user;
  const isAdmin = currentUser?.role === "ADMIN";

  const profileQuery = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: hydrated && Boolean(accessToken) && isAdmin,
  });

  const charactersQuery = useQuery({
    queryKey: ["user-characters", userId],
    queryFn: () => getCharactersByUser(userId),
    enabled: hydrated && Boolean(accessToken) && isAdmin,
  });

  const activityQuery = useQuery({
    queryKey: ["admin-user-activity", userId],
    queryFn: () => getAdminUserActivity(userId),
    enabled: hydrated && Boolean(accessToken) && isAdmin,
  });

  const reportsFiledQuery = useQuery({
    queryKey: ["moderation-reports-filed", userId],
    queryFn: () => getModerationReports({}),
    enabled: hydrated && Boolean(accessToken) && isAdmin,
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) router.replace("/login");
  }, [accessToken, hydrated, router]);

  useEffect(() => {
    if (currentUserQuery.data?.user) setUser(currentUserQuery.data.user);
  }, [currentUserQuery.data, setUser]);

  useEffect(() => {
    if (currentUserQuery.isError) {
      clearSession();
      router.replace("/login");
    }
  }, [clearSession, currentUserQuery.isError, router]);

  useEffect(() => {
    if (hydrated && accessToken && currentUser && !isAdmin) {
      router.replace("/moderation");
    }
  }, [accessToken, currentUser, hydrated, isAdmin, router]);

  if (!hydrated || currentUserQuery.isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Ładowanie...</div>;
  }

  if (!isAdmin) return null;

  const profile = profileQuery.data?.user;
  const characters = charactersQuery.data?.characters ?? [];
  const activityEntries = activityQuery.data?.entries ?? [];
  const allReports = reportsFiledQuery.data?.reports ?? [];
  const reportsFiled = allReports.filter((r) => r.reporterId === userId);
  const reportsAbout = allReports.filter((r) => r.targetId === userId);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button className="" size="sm" onClick={() => router.back()}>
          ← Wróć
        </Button>
        <h1 className="text-2xl font-bold">Profil użytkownika</h1>
      </div>

      {profileQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Ładowanie profilu...</p>
      )}

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>{profile.username}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {profile.displayName && (
              <p><span className="font-medium">Wyświetlana nazwa:</span> {profile.displayName}</p>
            )}
            <p><span className="font-medium">E-mail:</span> {profile.email}</p>
            <div className="flex gap-2 flex-wrap">
              <Badge className={profile.status === "ACTIVE" ? "bg-green-100 text-green-800" : profile.status === "BLOCKED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                {profile.status}
              </Badge>
              <Badge className={profile.role === "ADMIN" ? "bg-red-100 text-red-800" : profile.role === "GM" ? "bg-blue-100 text-blue-800" : ""}>
                {profile.role}
              </Badge>
              {profile.emailVerified ? (
                <Badge className="bg-green-100 text-green-800">Zweryfikowany</Badge>
              ) : (
                <Badge className="text-yellow-600">Niezweryfikowany</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Dołączył: {new Date(profile.createdAt).toLocaleDateString("pl-PL")}
            </p>
            {profile.lastSeenAt && (
              <p className="text-muted-foreground">
                Ostatnio widziany: {new Date(profile.lastSeenAt).toLocaleString("pl-PL")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Postacie ({characters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {characters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak postaci.</p>
          ) : (
            <ul className="space-y-1">
              {characters.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <Link href={`/characters/${c.id}`} className="hover:underline font-medium">
                    {c.name}
                  </Link>
                  {c.title && <span className="text-muted-foreground">— {c.title}</span>}
                  {c.world && (
                    <Badge className="text-xs">{c.world.name}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log aktywności (ostatnie 20)</CardTitle>
        </CardHeader>
        <CardContent>
          {activityEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak wpisów.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 pr-4 font-medium">Czas</th>
                    <th className="text-left py-1 pr-4 font-medium">Akcja</th>
                    <th className="text-left py-1 font-medium">Cel</th>
                  </tr>
                </thead>
                <tbody>
                  {activityEntries.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-muted/30">
                      <td className="py-1 pr-4 text-muted-foreground whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleString("pl-PL")}
                      </td>
                      <td className="py-1 pr-4">
                        <Badge className="">{e.action}</Badge>
                      </td>
                      <td className="py-1 text-muted-foreground text-xs font-mono">
                        {e.targetType && `${e.targetType}: ${e.targetId?.slice(0, 8)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Zgłoszenia złożone przez użytkownika ({reportsFiled.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsFiled.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak zgłoszeń.</p>
          ) : (
            <ul className="space-y-2">
              {reportsFiled.map((r) => (
                <li key={r.id} className="text-sm border rounded p-2">
                  <div className="flex gap-2 flex-wrap mb-1">
                    <Badge className="">{r.targetType}</Badge>
                    <Badge>{r.status}</Badge>
                  </div>
                  <p className="text-muted-foreground">{r.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Zgłoszenia dotyczące użytkownika ({reportsAbout.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsAbout.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak zgłoszeń.</p>
          ) : (
            <ul className="space-y-2">
              {reportsAbout.map((r) => (
                <li key={r.id} className="text-sm border rounded p-2">
                  <div className="flex gap-2 flex-wrap mb-1">
                    <Badge className="">{r.targetType}</Badge>
                    <Badge>{r.status}</Badge>
                  </div>
                  <p className="text-muted-foreground">{r.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Zgłoszony przez:{" "}
                    <Link href={`/admin/users/${r.reporterId}`} className="hover:underline">
                      {r.reporter.username}
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
