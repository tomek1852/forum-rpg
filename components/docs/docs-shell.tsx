"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getApiErrorMessage,
  getDocCategories,
  getDocCategoryPages,
  getDocPage,
} from "@/lib/api";
import type { DocCategory, DocPage } from "@/lib/types";

export function DocsShell() {
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | null>(null);
  const [selectedPage, setSelectedPage] = useState<DocPage | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["doc-categories"],
    queryFn: () => getDocCategories(),
  });

  const pagesQuery = useQuery({
    queryKey: ["doc-category-pages", selectedCategory?.id],
    queryFn: () => getDocCategoryPages(selectedCategory!.id),
    enabled: Boolean(selectedCategory),
  });

  const pageQuery = useQuery({
    queryKey: ["doc-page", selectedPage?.id],
    queryFn: () => getDocPage(selectedPage!.id),
    enabled: Boolean(selectedPage),
  });

  const categories = categoriesQuery.data?.categories ?? [];
  const pages = pagesQuery.data?.pages ?? [];
  const page = pageQuery.data?.page ?? null;

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <Badge>Dokumentacja</Badge>
          <h1 className="mt-4 font-display text-4xl text-[color:var(--foreground)]">
            Dokumentacja świata
          </h1>
          <p className="mt-2 text-[color:var(--foreground-muted)]">
            Przeglądaj kategorie i strony dokumentacji.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Kategorie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {categoriesQuery.isLoading ? (
                  <p className="text-sm text-[color:var(--foreground-muted)]">Ładowanie...</p>
                ) : categoriesQuery.isError ? (
                  <p className="text-sm text-[#9d3d2d]">
                    {getApiErrorMessage(categoriesQuery.error)}
                  </p>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-[color:var(--foreground-muted)]">
                    Brak kategorii.
                  </p>
                ) : (
                  categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedPage(null);
                      }}
                      className={`w-full rounded-[14px] px-3 py-2 text-left text-sm transition-colors hover:bg-[color:var(--surface-strong)] ${
                        selectedCategory?.id === cat.id
                          ? "bg-[color:var(--surface-strong)] font-semibold"
                          : ""
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {selectedCategory && pages.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{selectedCategory.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPage(p)}
                      className={`w-full rounded-[14px] px-3 py-2 text-left text-sm transition-colors hover:bg-[color:var(--surface-strong)] ${
                        selectedPage?.id === p.id
                          ? "bg-[color:var(--surface-strong)] font-semibold"
                          : ""
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Content */}
          <main>
            {!selectedCategory ? (
              <Card>
                <CardContent className="py-12 text-center text-[color:var(--foreground-muted)]">
                  Wybierz kategorię z listy, aby zobaczyć dostępne strony.
                </CardContent>
              </Card>
            ) : !selectedPage ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedCategory.name}</CardTitle>
                  {selectedCategory.description && (
                    <CardDescription>{selectedCategory.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {pagesQuery.isLoading ? (
                    <p className="text-sm text-[color:var(--foreground-muted)]">Ładowanie stron...</p>
                  ) : pages.length === 0 ? (
                    <p className="text-sm text-[color:var(--foreground-muted)]">
                      Brak stron w tej kategorii.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pages.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPage(p)}
                          className="w-full rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-left text-sm hover:bg-[color:var(--surface-strong)]"
                        >
                          <span className="font-semibold text-[color:var(--foreground)]">
                            {p.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>
                        {pageQuery.isLoading ? "Ładowanie..." : page?.title ?? selectedPage.title}
                      </CardTitle>
                      <CardDescription>
                        {page?.author
                          ? `Autor: ${page.author.displayName ?? page.author.username}`
                          : ""}
                      </CardDescription>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedPage(null)}
                    >
                      ← Powrót
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {pageQuery.isLoading ? (
                    <p className="text-sm text-[color:var(--foreground-muted)]">Ładowanie treści...</p>
                  ) : page ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{page.content}</ReactMarkdown>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
