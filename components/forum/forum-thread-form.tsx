"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createForumThread, getApiErrorMessage, getForumCategories } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { forumThreadSchema } from "@/lib/validators";

type ForumThreadFormValues = z.input<typeof forumThreadSchema>;

export function ForumThreadForm({
  initialCategoryId,
}: {
  initialCategoryId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, hydrated } = useAuthStore((state) => state);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hydrated, router]);

  const categoriesQuery = useQuery({
    queryKey: ["forum", "categories"],
    queryFn: getForumCategories,
    enabled: hydrated && Boolean(accessToken),
  });

  const form = useForm<ForumThreadFormValues>({
    resolver: zodResolver(forumThreadSchema),
    defaultValues: {
      categoryId: initialCategoryId ?? "",
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    if (initialCategoryId) {
      form.setValue("categoryId", initialCategoryId);
      return;
    }

    const firstCategory = categoriesQuery.data?.categories[0];

    if (firstCategory && !form.getValues("categoryId")) {
      form.setValue("categoryId", firstCategory.id);
    }
  }, [categoriesQuery.data, form, initialCategoryId]);

  const mutation = useMutation({
    mutationFn: createForumThread,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["forum"] });
      router.push(`/forum/${data.thread.categoryId}/${data.thread.id}`);
    },
  });

  const selectedCategoryId = useWatch({
    control: form.control,
    name: "categoryId",
  });

  if (!hydrated || (accessToken && categoriesQuery.isLoading)) {
    return (
      <div className="animate-pulse rounded-[32px] bg-[color:var(--surface-strong)] p-10">
        <div className="h-10 w-56 rounded-full bg-white/40" />
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nowy watek</CardTitle>
        <CardDescription>
          Wybierz kategorie, nadaj tytul i rozpocznij scene pierwszym postem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <Field label="Kategoria" error={form.formState.errors.categoryId?.message}>
            <select
              className="flex h-12 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
              {...form.register("categoryId")}
            >
              <option value="">Wybierz kategorie</option>
              {categoriesQuery.data?.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tytul watku" error={form.formState.errors.title?.message}>
            <Input {...form.register("title")} />
          </Field>
          <Field label="Pierwszy post" error={form.formState.errors.content?.message}>
            <Textarea className="min-h-56" {...form.register("content")} />
          </Field>
          <FormError message={mutation.isError ? getApiErrorMessage(mutation.error) : undefined} />
          <div className="flex flex-wrap gap-3">
            <Button size="lg" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Zapisywanie..." : "Utworz watek"}
            </Button>
            <Button asChild size="lg" type="button" variant="secondary">
              <Link href={selectedCategoryId ? `/forum/${selectedCategoryId}` : "/forum"}>
                Anuluj
              </Link>
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
