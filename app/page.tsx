import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="px-4 py-8 lg:px-8">
      <section className="mx-auto flex min-h-[72vh] max-w-7xl items-center rounded-[38px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)] lg:p-12">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-6">
            <Badge>Forum RPG / PBF Builder</Badge>
            <div className="space-y-5">
              <h1 className="max-w-4xl font-display text-6xl leading-none text-[color:var(--foreground)] sm:text-7xl">
                Zbuduj świat, zaloguj graczy i daj fabule stabilny start.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                Wejdź do panelu gracza, zarządzaj kontem i przygotuj przestrzeń pod dalszy rozwój forumowej opowieści.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Załóż konto
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Zaloguj się</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <HeroMetric label="Konta" value="Rejestracja" />
            <HeroMetric label="Sesja" value="Logowanie" />
            <HeroMetric label="Panel" value="Dashboard" />
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/70 p-5 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--foreground-subtle)]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
