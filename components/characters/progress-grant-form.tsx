"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addCharacterProgress, getApiErrorMessage } from "@/lib/api";
import { progressGrantSchema } from "@/lib/validators";

type ProgressGrantFormValues = z.input<typeof progressGrantSchema>;

export function ProgressGrantForm({ characterId }: { characterId: string }) {
  const queryClient = useQueryClient();
  const form = useForm<ProgressGrantFormValues>({
    resolver: zodResolver(progressGrantSchema),
    defaultValues: {
      expDelta: "",
      phDelta: "",
      reason: "",
      note: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ProgressGrantFormValues) =>
      addCharacterProgress(characterId, {
        expDelta: toOptionalNumber(values.expDelta),
        phDelta: toOptionalNumber(values.phDelta),
        reason: values.reason,
        note: values.note || undefined,
      }),
    onSuccess: async () => {
      form.reset();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["character", characterId] }),
        queryClient.invalidateQueries({ queryKey: ["character-progress", characterId] }),
        queryClient.invalidateQueries({ queryKey: ["character-rankings"] }),
      ]);
    },
  });

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="EXP" error={form.formState.errors.expDelta?.message}>
          <Input inputMode="numeric" placeholder="0" {...form.register("expDelta")} />
        </Field>
        <Field label="PH" error={form.formState.errors.phDelta?.message}>
          <Input inputMode="numeric" placeholder="0" {...form.register("phDelta")} />
        </Field>
      </div>
      <Field label="Powód" error={form.formState.errors.reason?.message}>
        <Input placeholder="Sesja, quest, bonus za scenę..." {...form.register("reason")} />
      </Field>
      <Field label="Notatka dla historii" error={form.formState.errors.note?.message}>
        <Textarea className="min-h-24" {...form.register("note")} />
      </Field>
      {mutation.isSuccess ? (
        <p className="text-sm text-[color:var(--foreground-muted)]">Progres został przyznany.</p>
      ) : null}
      {mutation.isError ? (
        <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(mutation.error)}</p>
      ) : null}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Przyznawanie..." : "Przyznaj progres"}
      </Button>
    </form>
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
      {error ? <p className="mt-2 text-sm text-[#9d3d2d]">{error}</p> : null}
    </div>
  );
}

function toOptionalNumber(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return Number(trimmed);
}
