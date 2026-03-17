import Link from "next/link";
import { ArrowRight, KeyRound, ScrollText, ShieldEllipsis } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="px-4 py-8 lg:px-8">
      <section className="mx-auto grid min-h-[72vh] max-w-7xl gap-8 rounded-[38px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)] lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-6">
            <Badge>Forum RPG / PBF Builder</Badge>
            <div className="space-y-5">
              <h1 className="max-w-4xl font-display text-6xl leading-none text-[color:var(--foreground)] sm:text-7xl">
                Zbuduj swiat, zaloguj graczy i daj fabule stabilny start.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                Frontend w Next.js i backend w NestJS sa juz ustawione pod rejestracje, logowanie, refresh sesji i chroniony dashboard.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Zaloz konto
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Zaloguj sie</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <HeroMetric label="Auth" value="JWT + refresh" />
            <HeroMetric label="DB" value="PostgreSQL + Prisma" />
            <HeroMetric label="UI" value="Tailwind + shadcn/ui" />
          </div>
        </div>
        <Card className="self-stretch">
          <CardHeader>
            <CardDescription>Zakres MVP Fazy 1</CardDescription>
            <CardTitle>Co jest juz gotowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FeatureRow
              icon={<ShieldEllipsis className="size-5" />}
              title="Rejestracja i logowanie"
              text="Tworzenie kont i sesje oparte o access token oraz refresh token."
            />
            <FeatureRow
              icon={<KeyRound className="size-5" />}
              title="Reset hasla"
              text="Mockowany token developerski umozliwia szybkie testowanie bez poczty."
            />
            <FeatureRow
              icon={<ScrollText className="size-5" />}
              title="Dashboard i role"
              text="Chroniony panel gracza przygotowany pod postacie, forum i administracje."
            />
          </CardContent>
        </Card>
      </section>
      <section className="mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-3">
        <LoreCard
          title="Backend gotowy pod kolejne fazy"
          text="NestJS ma osobne moduly auth, users i prisma, wiec dalsze domeny mozna dokladac bez przepisywania podstaw."
        />
        <LoreCard
          title="Frontend nie jest tylko formularzem"
          text="React Query i Zustand obsluguja sesje oraz odswiezanie tokenow, a design od razu buduje klimat gry tekstowej."
        />
        <LoreCard
          title="Rozwoj projektu zostal rozpisany"
          text="Po zakonczeniu tej fazy wystarczy przejsc do systemu postaci i dopinac kolejne widoki wedlug planu."
        />
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

function FeatureRow({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-[24px] bg-[color:var(--surface)] p-5">
      <div className="rounded-full bg-white p-3 text-[color:var(--accent-strong)]">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-muted)]">
          {text}
        </p>
      </div>
    </div>
  );
}

function LoreCard({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
          {text}
        </p>
      </CardContent>
    </Card>
  );
}
