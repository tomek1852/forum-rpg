"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCombatEncounters, getCurrentUser } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { CombatStatus } from "@/lib/types";

const STATUS_LABELS: Record<CombatStatus, string> = {
  PREPARING: "Przygotowanie",
  ACTIVE: "Aktywne",
  FINISHED: "Zakończone",
  CANCELLED: "Anulowane",
};

const STATUS_COLORS: Record<CombatStatus, string> = {
  PREPARING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  FINISHED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function CombatShell() {
  const { accessToken, hydrated, user } = useAuthStore((s) => s);

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const currentUser = currentUserQuery.data?.user ?? user;
  const isGm = currentUser?.role === "GM" || currentUser?.role === "ADMIN";

  const encountersQuery = useQuery({
    queryKey: ["combat-encounters"],
    queryFn: () => getCombatEncounters(),
    enabled: hydrated && Boolean(accessToken),
  });

  const encounters = encountersQuery.data?.encounters ?? [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Starcia</h1>
        {isGm && (
          <Button asChild>
            <Link href="/combat/new">Nowe starcie</Link>
          </Button>
        )}
      </div>

      {encountersQuery.isLoading && <p className="text-muted-foreground">Ładowanie...</p>}

      {encounters.length === 0 && !encountersQuery.isLoading && (
        <p className="text-muted-foreground">Brak starć.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {encounters.map((enc) => (
          <Card key={enc.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{enc.title}</CardTitle>
                <Badge className={STATUS_COLORS[enc.status]}>
                  {STATUS_LABELS[enc.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Runda: {enc.roundNumber}</p>
              <p>Uczestnicy: {enc._count.participants}</p>
              <p>GM: {enc.gm.displayName ?? enc.gm.username}</p>
              <Button asChild variant="secondary" size="sm" className="mt-2 w-full">
                <Link href={`/combat/${enc.id}`}>Szczegóły</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
