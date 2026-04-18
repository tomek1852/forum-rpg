"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function NotificationsShell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, hydrated } = useAuthStore((state) => state);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hydrated, router]);

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: hydrated && Boolean(accessToken),
  });

  const markOneMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (!hydrated || (accessToken && query.isLoading)) {
    return (
      <div className="min-h-screen px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-14 w-72 rounded-full bg-[color:var(--surface-strong)]" />
          <div className="h-40 rounded-[28px] bg-[color:var(--surface-strong)]" />
          <div className="h-40 rounded-[28px] bg-[color:var(--surface-strong)]" />
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  const notifications = query.data?.notifications ?? [];

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>Powiadomienia</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  Twoje aktualizacje
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  Tutaj zobaczysz odpowiedzi, cytaty i podstawowe sygnały z forum.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                size="lg"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending || !query.data?.unreadCount}
              >
                {markAllMutation.isPending
                  ? "Zapisywanie..."
                  : "Oznacz wszystko jako przeczytane"}
              </Button>
            </div>
          </div>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Nieprzeczytane</CardTitle>
            <CardDescription>
              {query.data?.unreadCount ?? 0} nowych powiadomień czeka na Twoją uwagę.
            </CardDescription>
          </CardHeader>
        </Card>
        {query.isError ? (
          <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(query.error)}</p>
        ) : null}
        <section className="space-y-4">
          {notifications.length ? (
            notifications.map((notification) => (
              <Card
                className={notification.isRead ? "opacity-85" : ""}
                key={notification.id}
              >
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {!notification.isRead ? <Badge>Nowe</Badge> : null}
                        <Badge>{translateNotificationType(notification.type)}</Badge>
                      </div>
                      <CardTitle className="mt-3">{notification.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {formatNotificationDate(notification.createdAt)}
                      </CardDescription>
                    </div>
                    {!notification.isRead ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => markOneMutation.mutate(notification.id)}
                        disabled={markOneMutation.isPending}
                      >
                        Oznacz jako przeczytane
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <p className="max-w-3xl text-sm leading-7 text-[color:var(--foreground-muted)]">
                    {notification.message}
                  </p>
                  {notification.link ? (
                    <Button asChild variant="secondary">
                      <Link href={notification.link}>Otwórz</Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-10 text-sm leading-7 text-[color:var(--foreground-muted)]">
                Nie masz jeszcze żadnych powiadomień. Gdy ktoś odpowie w Twoim
                wątku albo zacytuje post, zobaczysz to tutaj.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function formatNotificationDate(value: string) {
  return new Date(value).toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function translateNotificationType(type: string) {
  switch (type) {
    case "FORUM_NEW_THREAD":
      return "Nowy wątek";
    case "FORUM_THREAD_REPLY":
      return "Odpowiedź";
    case "FORUM_POST_QUOTE":
      return "Cytat";
    default:
      return "Aktualizacja";
  }
}
