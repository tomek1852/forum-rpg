"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCombatEncounter, getApiErrorMessage, getCurrentUser, getWorlds } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const schema = z.object({
  title: z.string().min(3, "Tytuł musi mieć minimum 3 znaki"),
  worldId: z.string().uuid("Wybierz świat"),
  characterIds: z.array(z.string()).min(1, "Dodaj przynajmniej jedną postać"),
});

type FormValues = z.input<typeof schema>;

export function NewCombatShell() {
  const router = useRouter();
  const { accessToken, hydrated, user } = useAuthStore((s) => s);
  const [characterInput, setCharacterInput] = useState("");
  const [characterIds, setCharacterIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const currentUser = currentUserQuery.data?.user ?? user;
  const isGm = currentUser?.role === "GM" || currentUser?.role === "ADMIN";

  const worldsQuery = useQuery({
    queryKey: ["worlds"],
    queryFn: getWorlds,
    enabled: hydrated && Boolean(accessToken),
  });

  const worlds = worldsQuery.data?.worlds ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", worldId: "", characterIds: [] },
  });

  const mutation = useMutation({
    mutationFn: createCombatEncounter,
    onSuccess: (data) => {
      router.push(`/combat/${data.encounter.id}`);
    },
    onError: (err) => {
      setError(getApiErrorMessage(err));
    },
  });

  function addCharacter() {
    const id = characterInput.trim();
    if (id && !characterIds.includes(id)) {
      const updated = [...characterIds, id];
      setCharacterIds(updated);
      form.setValue("characterIds", updated);
    }
    setCharacterInput("");
  }

  function removeCharacter(id: string) {
    const updated = characterIds.filter((c) => c !== id);
    setCharacterIds(updated);
    form.setValue("characterIds", updated);
  }

  function onSubmit(values: FormValues) {
    setError("");
    mutation.mutate(values);
  }

  if (!isGm) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Tylko GM może tworzyć starcia.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Nowe starcie</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Tytuł</Label>
              <Input {...form.register("title")} placeholder="Nazwa starcia" />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Świat</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                {...form.register("worldId")}
              >
                <option value="">-- wybierz świat --</option>
                {worlds.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.worldId && (
                <p className="text-sm text-red-500">{form.formState.errors.worldId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Postacie (ID)</Label>
              <div className="flex gap-2">
                <Input
                  value={characterInput}
                  onChange={(e) => setCharacterInput(e.target.value)}
                  placeholder="UUID postaci"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCharacter();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addCharacter}>
                  Dodaj
                </Button>
              </div>
              {characterIds.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {characterIds.map((id) => (
                    <li key={id} className="flex items-center justify-between text-sm bg-muted px-2 py-1 rounded">
                      <span className="truncate">{id}</span>
                      <button
                        type="button"
                        className="text-red-500 ml-2"
                        onClick={() => removeCharacter(id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {form.formState.errors.characterIds && (
                <p className="text-sm text-red-500">{form.formState.errors.characterIds.message}</p>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Tworzenie..." : "Utwórz starcie"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
