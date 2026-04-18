"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage, updateMyProfile } from "@/lib/api";
import { User } from "@/lib/types";
import { profileSchema } from "@/lib/validators";

type ProfileFormValues = z.input<typeof profileSchema>;

export function ProfileForm({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.displayName ?? "",
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["current-user"] }),
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] }),
      ]);
    },
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <div>
        <Label htmlFor="displayName">Nazwa wyświetlana</Label>
        <Input id="displayName" {...form.register("displayName")} />
        <FieldError message={form.formState.errors.displayName?.message} />
      </div>
      <div>
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input id="avatarUrl" {...form.register("avatarUrl")} />
        <FieldError message={form.formState.errors.avatarUrl?.message} />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" className="min-h-28" {...form.register("bio")} />
        <FieldError message={form.formState.errors.bio?.message} />
      </div>
      <FieldError message={mutation.isError ? getApiErrorMessage(mutation.error) : undefined} />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Zapisywanie..." : "Zapisz profil"}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-[#9d3d2d]">{message}</p>;
}
