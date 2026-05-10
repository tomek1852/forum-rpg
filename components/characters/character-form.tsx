"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCharacter, getApiErrorMessage, getWorlds, updateCharacter } from "@/lib/api";
import type { Character, CharacterPayload, StatDefinition, World } from "@/lib/types";
import { characterSchema } from "@/lib/validators";

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
      worldId: character?.world?.id ?? "",
      title: character?.title ?? "",
      summary: character?.summary ?? "",
      biography: character?.biography ?? "",
      appearance: character?.appearance ?? "",
      avatarUrl: character?.avatarUrl ?? "",
      stats: buildExistingStatInputs(character),
      isPublic: character?.isPublic ?? true,
    },
  });

  const worldsQuery = useQuery({
    queryKey: ["worlds"],
    queryFn: getWorlds,
  });

  const worlds = worldsQuery.data?.worlds ?? [];
  const selectedWorldId = useWatch({
    control: form.control,
    name: "worldId",
  });
  const selectedWorld = worlds.find((world) => world.id === selectedWorldId) ?? null;

  const mutation = useMutation({
    mutationFn: async (values: CharacterFormValues) => {
      if (!selectedWorld) {
        throw new Error("Wybierz świat postaci.");
      }

      const payload: CharacterPayload = {
        name: values.name,
        worldId: values.worldId,
        title: values.title || undefined,
        summary: values.summary || undefined,
        biography: values.biography || undefined,
        appearance: values.appearance || undefined,
        avatarUrl: values.avatarUrl || undefined,
        statValues: buildStatPayload(selectedWorld.statDefinitions, values.stats ?? {}),
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

  const worldField = form.register("worldId");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Nowa postać" : "Edycja postaci"}</CardTitle>
        <CardDescription>
          Wybierz świat gry, uzupełnij opis i wpisz statystyki zdefiniowane dla tej
          rozgrywki.
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

          <Field label="Świat gry" error={form.formState.errors.worldId?.message}>
            <select
              {...worldField}
              className="h-12 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
              onChange={(event) => {
                worldField.onChange(event);
                const nextWorld = worlds.find((world) => world.id === event.target.value) ?? null;
                form.setValue("stats", nextWorld ? buildInitialStatInputs(nextWorld, character) : {});
              }}
            >
              <option value="">Wybierz świat</option>
              {worlds.map((world) => (
                <option key={world.id} value={world.id}>
                  {world.name}
                </option>
              ))}
            </select>
            {worldsQuery.isLoading ? (
              <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
                Ładowanie dostępnych światów...
              </p>
            ) : null}
            {!worldsQuery.isLoading && worlds.length === 0 ? (
              <p className="mt-2 text-sm text-[#9d3d2d]">
                Brak skonfigurowanych światów. GM lub administrator musi najpierw dodać
                świat i jego statystyki.
              </p>
            ) : null}
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

          <div className="space-y-3 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <div>
              <h3 className="font-semibold text-[color:var(--foreground)]">Statystyki świata</h3>
              <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">
                Pola poniżej zmieniają się zależnie od wybranego świata gry.
              </p>
            </div>
            {selectedWorld ? (
              selectedWorld.statDefinitions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedWorld.statDefinitions.map((definition) => (
                    <DynamicStatField
                      definition={definition}
                      register={form.register(`stats.${definition.id}`)}
                      key={definition.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[color:var(--foreground-muted)]">
                  Ten świat nie ma jeszcze skonfigurowanych statystyk. Możesz zapisać
                  postać bez nich lub najpierw dodać definicje w panelu MG.
                </p>
              )
            ) : (
              <p className="text-sm text-[color:var(--foreground-muted)]">
                Najpierw wybierz świat, aby wyświetlić odpowiadające mu statystyki.
              </p>
            )}
          </div>

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
            <Button
              size="lg"
              type="submit"
              disabled={mutation.isPending || worldsQuery.isLoading || worlds.length === 0}
            >
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

function DynamicStatField({
  definition,
  register,
}: {
  definition: StatDefinition;
  register: UseFormRegisterReturn;
}) {
  return (
    <div>
      <Label>
        {definition.label}
        {definition.isRequired ? " *" : ""}
      </Label>
      {definition.valueType === "NUMBER" ? (
        <Input
          type="number"
          min={definition.minValue ?? undefined}
          max={definition.maxValue ?? undefined}
          {...register}
        />
      ) : (
        <Input {...register} />
      )}
      {definition.description ? (
        <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
          {definition.description}
        </p>
      ) : null}
    </div>
  );
}

function buildExistingStatInputs(character?: Character) {
  return Object.fromEntries(
    (character?.statValues ?? []).map((statValue) => [
      statValue.statDefinition.id,
      statValue.numericValue !== null
        ? String(statValue.numericValue)
        : (statValue.textValue ?? ""),
    ]),
  );
}

function buildInitialStatInputs(world: World, character?: Character) {
  const currentValues = new Map(Object.entries(buildExistingStatInputs(character)));

  return Object.fromEntries(
    world.statDefinitions.map((definition) => [
      definition.id,
      currentValues.get(definition.id) ??
        (definition.valueType === "NUMBER"
          ? definition.defaultNumericValue?.toString() ?? ""
          : definition.defaultTextValue ?? ""),
    ]),
  );
}

function buildStatPayload(
  definitions: StatDefinition[],
  statInputs: Record<string, string>,
): CharacterPayload["statValues"] {
  const statValues: NonNullable<CharacterPayload["statValues"]> = [];

  for (const definition of definitions) {
    const rawValue = (statInputs[definition.id] ?? "").trim();

    if (!rawValue) {
      continue;
    }

    if (definition.valueType === "NUMBER") {
      const numericValue = Number(rawValue);

      if (Number.isNaN(numericValue)) {
        throw new Error(`Statystyka "${definition.label}" musi być liczbą.`);
      }

      statValues.push({ statDefinitionId: definition.id, numericValue });
      continue;
    }

    statValues.push({ statDefinitionId: definition.id, textValue: rawValue });
  }

  return statValues;
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
