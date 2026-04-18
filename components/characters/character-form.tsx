"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { characterSchema } from "@/lib/validators";
import { createCharacter, getApiErrorMessage, updateCharacter } from "@/lib/api";
import { Character } from "@/lib/types";

type CharacterFormValues = z.input<typeof characterSchema>;

export function CharacterForm({
  mode,
  character,
}: {
  mode: "create" | "edit";
  character?: Character;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: character?.name ?? "",
      title: character?.title ?? "",
      summary: character?.summary ?? "",
      biography: character?.biography ?? "",
      appearance: character?.appearance ?? "",
      avatarUrl: character?.avatarUrl ?? "",
      statsRaw: character?.statsJson
        ? JSON.stringify(character.statsJson, null, 2)
        : "",
      isPublic: character?.isPublic ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CharacterFormValues) => {
      const statsRaw = values.statsRaw ?? "";
      const payload = {
        name: values.name ?? "",
        title: values.title || undefined,
        summary: values.summary || undefined,
        biography: values.biography || undefined,
        appearance: values.appearance || undefined,
        avatarUrl: values.avatarUrl || undefined,
        statsJson: statsRaw.trim()
          ? (JSON.parse(statsRaw) as Record<string, string | number>)
          : {},
        isPublic: values.isPublic ?? true,
      };

      if (mode === "edit" && character) {
        return updateCharacter(character.id, payload);
      }

      return createCharacter(payload);
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-characters"] }),
        queryClient.invalidateQueries({ queryKey: ["character", data.character.id] }),
      ]);
      router.push(`/character/${data.character.id}`);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Nowa postać" : "Edycja postaci"}</CardTitle>
        <CardDescription>
          Uzupełnij dane podstawowe, opis i bazowe statystyki w formacie JSON.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <Field label="Imię postaci" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </Field>
          <Field label="Tytuł lub rola" error={form.formState.errors.title?.message}>
            <Input {...form.register("title")} />
          </Field>
          <Field label="Skrót opisu" error={form.formState.errors.summary?.message}>
            <Textarea className="min-h-24" {...form.register("summary")} />
          </Field>
          <Field label="Biografia" error={form.formState.errors.biography?.message}>
            <Textarea {...form.register("biography")} />
          </Field>
          <Field label="Wygląd" error={form.formState.errors.appearance?.message}>
            <Textarea className="min-h-28" {...form.register("appearance")} />
          </Field>
          <Field label="Avatar URL" error={form.formState.errors.avatarUrl?.message}>
            <Input {...form.register("avatarUrl")} />
          </Field>
          <Field label="Statystyki (JSON)" error={form.formState.errors.statsRaw?.message}>
            <Textarea
              className="min-h-40 font-mono text-xs"
              {...form.register("statsRaw")}
              placeholder={'{"siła": 8, "zręczność": 6, "klasa": "łowca"}'}
            />
          </Field>
          <label className="flex items-center gap-3 rounded-2xl bg-[color:var(--surface)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
            <input
              className="size-4 accent-[color:var(--accent)]"
              type="checkbox"
              {...form.register("isPublic")}
            />
            Pokazuj postać publicznie w profilu
          </label>
          <FormError message={mutation.isError ? getApiErrorMessage(mutation.error) : undefined} />
          <div className="flex gap-3">
            <Button size="lg" type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Zapisywanie..."
                : mode === "create"
                  ? "Utwórz postać"
                  : "Zapisz zmiany"}
            </Button>
            <Button
              size="lg"
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Wróć
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      <FormError message={error} />
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-[#9d3d2d]">{message}</p>;
}
