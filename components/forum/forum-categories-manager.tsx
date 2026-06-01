"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createForumCategory,
  deleteForumCategory,
  getApiErrorMessage,
  getForumCategories,
  updateForumCategory,
} from "@/lib/api";
import type { ForumCategory, Role } from "@/lib/types";

const ALL_ROLES: Role[] = ["PLAYER", "GM", "ADMIN"];

const ROLE_LABELS: Record<Role, string> = {
  PLAYER: "Gracz",
  GM: "MG",
  ADMIN: "Admin",
};

type CategoryFormState = {
  title: string;
  description: string;
  color: string;
  sortOrder: string;
  allowedRoles: Role[];
  isArchived: boolean;
};

const emptyForm: CategoryFormState = {
  title: "",
  description: "",
  color: "",
  sortOrder: "0",
  allowedRoles: [],
  isArchived: false,
};

function categoryToForm(cat: ForumCategory): CategoryFormState {
  return {
    title: cat.title,
    description: cat.description ?? "",
    color: cat.color ?? "",
    sortOrder: String(cat.sortOrder),
    allowedRoles: cat.allowedRoles as Role[],
    isArchived: cat.isArchived,
  };
}

export function ForumCategoriesManager() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [formError, setFormError] = useState<string | undefined>();

  const categoriesQuery = useQuery({
    queryKey: ["forum", "categories"],
    queryFn: getForumCategories,
  });

  const categories = categoriesQuery.data?.categories ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });

  const createMutation = useMutation({
    mutationFn: createForumCategory,
    onSuccess: async () => {
      await invalidate();
      setModalOpen(false);
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateForumCategory>[1] }) =>
      updateForumCategory(id, payload),
    onSuccess: async () => {
      await invalidate();
      setModalOpen(false);
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteForumCategory,
    onSuccess: invalidate,
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, sortOrder }: { id: string; sortOrder: number }) =>
      updateForumCategory(id, { sortOrder }),
    onSuccess: invalidate,
  });

  function openCreate() {
    setEditingCategory(null);
    setForm(emptyForm);
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(cat: ForumCategory) {
    setEditingCategory(cat);
    setForm(categoryToForm(cat));
    setFormError(undefined);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      color: form.color.trim() || undefined,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      allowedRoles: form.allowedRoles,
    };

    if (!payload.title) {
      setFormError("Nazwa kategorii jest wymagana.");
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, payload: { ...payload, isArchived: form.isArchived } });
    } else {
      createMutation.mutate(payload);
    }
  }

  function toggleRole(role: Role) {
    setForm((prev) => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter((r) => r !== role)
        : [...prev.allowedRoles, role],
    }));
  }

  function moveCategory(catId: string, direction: "up" | "down") {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((c) => c.id === catId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = sorted[idx];
    const swap = sorted[swapIdx];

    const newCurrentOrder = swap.sortOrder;
    const newSwapOrder =
      current.sortOrder === swap.sortOrder
        ? direction === "up"
          ? swap.sortOrder - 1
          : swap.sortOrder + 1
        : current.sortOrder;

    moveMutation.mutate({ id: current.id, sortOrder: newCurrentOrder });
    moveMutation.mutate({ id: swap.id, sortOrder: newSwapOrder });
  }

  const sortedCategories = [...categories].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title);
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-display text-3xl text-[color:var(--foreground)]">
            Kategorie forum
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-muted)]">
            Zarządzaj kategoriami, uprawnieniami dostępu i kolejnością wyświetlania.
          </p>
        </div>
        <Button onClick={openCreate}>Nowa kategoria</Button>
      </div>

      {categoriesQuery.isError ? (
        <p className="text-sm text-[#9d3d2d]">{getApiErrorMessage(categoriesQuery.error)}</p>
      ) : null}

      {sortedCategories.length === 0 && !categoriesQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-sm leading-7 text-[color:var(--foreground-muted)]">
            Brak kategorii forum. Utwórz pierwszą klikając przycisk powyżej.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {sortedCategories.map((cat, idx) => (
          <Card key={cat.id} className={cat.isArchived ? "opacity-60" : undefined}>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {cat.color ? (
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-[color:var(--border)]"
                        style={{ backgroundColor: cat.color }}
                      />
                    ) : null}
                    <CardTitle className="text-xl">{cat.title}</CardTitle>
                    {cat.isArchived ? (
                      <Badge className="opacity-70">Archiwum</Badge>
                    ) : null}
                    {cat.allowedRoles.length > 0 ? (
                      <Badge className="opacity-70">
                        Dostęp: {cat.allowedRoles.map((r) => ROLE_LABELS[r as Role]).join(", ")}
                      </Badge>
                    ) : (
                      <Badge className="opacity-70">Dostęp: wszyscy</Badge>
                    )}
                  </div>
                  <CardDescription>
                    Kolejność: {cat.sortOrder} · {cat.threadCount ?? 0} wątków
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="opacity-70"
                    disabled={idx === 0 || moveMutation.isPending}
                    onClick={() => moveCategory(cat.id, "up")}
                    aria-label="Przesuń wyżej"
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    className="opacity-70"
                    disabled={idx === sortedCategories.length - 1 || moveMutation.isPending}
                    onClick={() => moveCategory(cat.id, "down")}
                    aria-label="Przesuń niżej"
                  >
                    ↓
                  </Button>
                  <Button size="sm" className="opacity-70" onClick={() => openEdit(cat)}>
                    Edytuj
                  </Button>
                  {!cat.isArchived ? (
                    <Button
                      size="sm"
                      className="opacity-70"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(cat.id)}
                    >
                      Archiwizuj
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            {cat.description ? (
              <CardContent>
                <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                  {cat.description}
                </p>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl">
            <h2 className="font-display text-2xl text-[color:var(--foreground)]">
              {editingCategory ? "Edytuj kategorię" : "Nowa kategoria"}
            </h2>
            <p className="mt-1 mb-5 text-sm text-[color:var(--foreground-muted)]">
              {editingCategory
                ? "Zmień nazwę, opis, uprawnienia lub status kategorii."
                : "Wypełnij dane nowej kategorii forum."}
            </p>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="cat-title">Nazwa *</Label>
                <Input
                  id="cat-title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  maxLength={80}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat-desc">Opis</Label>
                <Textarea
                  id="cat-desc"
                  className="min-h-20"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  maxLength={240}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat-color">Kolor (hex, np. #9d3d2d)</Label>
                <Input
                  id="cat-color"
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  placeholder="#9d3d2d"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat-sort">Kolejność (sortOrder)</Label>
                <Input
                  id="cat-sort"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Dozwolone role (puste = wszyscy)</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((role) => (
                    <label
                      key={role}
                      className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[color:var(--border)] px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="accent-[color:var(--accent)]"
                        checked={form.allowedRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                      />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </div>
              </div>
              {editingCategory ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[color:var(--surface-strong)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                  <input
                    type="checkbox"
                    className="size-4 accent-[color:var(--accent)]"
                    checked={form.isArchived}
                    onChange={(e) => setForm((p) => ({ ...p, isArchived: e.target.checked }))}
                  />
                  Zarchiwizowana (ukryta dla graczy)
                </label>
              ) : null}
              {formError ? <p className="text-sm text-[#9d3d2d]">{formError}</p> : null}
              <div className="flex justify-end gap-3">
                <Button type="button" className="opacity-70" onClick={() => setModalOpen(false)}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Zapisywanie..." : editingCategory ? "Zapisz zmiany" : "Utwórz"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
