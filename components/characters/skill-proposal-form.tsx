"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSkillProposal, getApiErrorMessage } from "@/lib/api";
import { skillProposalSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SkillProposalFormValues = z.input<typeof skillProposalSchema>;

export function SkillProposalForm({ characterId }: { characterId: string }) {
  const queryClient = useQueryClient();
  const form = useForm<SkillProposalFormValues>({
    resolver: zodResolver(skillProposalSchema),
    defaultValues: {
      name: "",
      description: "",
      mechanics: "",
      costs: "",
      limitations: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: SkillProposalFormValues) =>
      createSkillProposal({
        characterId,
        name: values.name,
        description: values.description,
        mechanics: values.mechanics || undefined,
        costs: values.costs || undefined,
        limitations: values.limitations || undefined,
      }),
    onSuccess: async () => {
      form.reset();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["character", characterId] }),
        queryClient.invalidateQueries({ queryKey: ["skill-proposals-review"] }),
      ]);
    },
  });

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <Field label="Nazwa umiejętności" error={form.formState.errors.name?.message}>
        <Input {...form.register("name")} />
      </Field>
      <Field label="Opis" error={form.formState.errors.description?.message}>
        <Textarea className="min-h-28" {...form.register("description")} />
      </Field>
      <Field label="Mechanika" error={form.formState.errors.mechanics?.message}>
        <Textarea className="min-h-24" {...form.register("mechanics")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Koszty / cena" error={form.formState.errors.costs?.message}>
          <Textarea className="min-h-24" {...form.register("costs")} />
        </Field>
        <Field label="Ograniczenia" error={form.formState.errors.limitations?.message}>
          <Textarea className="min-h-24" {...form.register("limitations")} />
        </Field>
      </div>
      {mutation.isSuccess ? (
        <p className="text-sm text-[color:var(--foreground-muted)]">
          Propozycja została wysłana do review.
        </p>
      ) : null}
      {mutation.isError ? (
        <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(mutation.error)}</p>
      ) : null}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Wysyłanie..." : "Zgłoś umiejętność"}
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
