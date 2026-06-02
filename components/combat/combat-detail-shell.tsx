"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getCombatEncounter,
  getApiErrorMessage,
  getCurrentUser,
  setCombatInitiative,
  startCombatEncounter,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { CombatParticipant, CombatStatus } from "@/lib/types";

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

export function CombatDetailShell({ encounterId }: { encounterId: string }) {
  const queryClient = useQueryClient();
  const { accessToken, hydrated, user } = useAuthStore((s) => s);
  const [initiatives, setInitiatives] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const currentUser = currentUserQuery.data?.user ?? user;

  const encounterQuery = useQuery({
    queryKey: ["combat-encounter", encounterId],
    queryFn: () => getCombatEncounter(encounterId),
    enabled: hydrated && Boolean(accessToken),
  });

  const encounter = encounterQuery.data?.encounter;
  const isGm =
    (currentUser?.role === "GM" || currentUser?.role === "ADMIN") &&
    encounter?.gmId === currentUser?.id;

  const initiativeMutation = useMutation({
    mutationFn: (entries: Array<{ characterId: string; initiative: number }>) =>
      setCombatInitiative(encounterId, { entries }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combat-encounter", encounterId] });
      setError("");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const startMutation = useMutation({
    mutationFn: () => startCombatEncounter(encounterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combat-encounter", encounterId] });
      setError("");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  function handleSetInitiative() {
    const entries = Object.entries(initiatives)
      .filter(([, v]) => v !== "")
      .map(([characterId, v]) => ({ characterId, initiative: Number(v) }));
    if (entries.length === 0) return;
    initiativeMutation.mutate(entries);
  }

  if (encounterQuery.isLoading) {
    return <div className="container mx-auto py-8">Ładowanie...</div>;
  }

  if (!encounter) {
    return <div className="container mx-auto py-8">Starcie nie istnieje.</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{encounter.title}</h1>
          <p className="text-muted-foreground text-sm">
            GM: {encounter.gm.displayName ?? encounter.gm.username} · Runda: {encounter.roundNumber}
          </p>
        </div>
        <Badge className={STATUS_COLORS[encounter.status]}>
          {STATUS_LABELS[encounter.status]}
        </Badge>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {isGm && encounter.status === "PREPARING" && (
        <div className="flex gap-2">
          <Button onClick={handleSetInitiative} variant="secondary" disabled={initiativeMutation.isPending}>
            Zapisz inicjatywę
          </Button>
          <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
            Rozpocznij starcie
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {encounter.participants.map((p: CombatParticipant) => (
          <Card key={p.id} className={p.isAlive ? "" : "opacity-50"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{p.character.name}</span>
                {!p.isAlive && <Badge className="bg-red-100 text-red-800">Pokonany</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex gap-4">
                <span>HP: {p.hp}/{p.maxHp}</span>
                {p.turnOrder != null && <span>Kolejność: {p.turnOrder}</span>}
              </div>
              {p.initiative != null && <p>Inicjatywa: {p.initiative}</p>}
              {isGm && encounter.status === "PREPARING" && (
                <Input
                  type="number"
                  placeholder="Inicjatywa"
                  value={initiatives[p.characterId] ?? ""}
                  onChange={(e) =>
                    setInitiatives((prev) => ({ ...prev, [p.characterId]: e.target.value }))
                  }
                  className="h-8"
                />
              )}
              {p.effects.length > 0 && (
                <div>
                  <p className="font-medium">Efekty:</p>
                  <ul className="list-disc list-inside">
                    {p.effects.map((ef) => (
                      <li key={ef.id}>{ef.name} ({ef.duration - (encounter.roundNumber - ef.appliedAt)} rund)</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
