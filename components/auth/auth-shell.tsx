import Link from "next/link";
import { ShieldCheck, Sword, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen gap-8 px-4 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
      <section className="relative overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)] lg:p-12">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(229,155,82,0.28),_transparent_62%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="space-y-6">
            <Badge>Forum RPG</Badge>
            <div className="space-y-4">
              <h1 className="max-w-xl font-display text-5xl leading-tight text-[color:var(--foreground)] sm:text-6xl">
                {title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                {description}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureTile
              icon={<ShieldCheck className="size-5" />}
              title="Bezpieczne logowanie"
              text="Konto gracza jest chronione i gotowe do codziennego korzystania."
            />
            <FeatureTile
              icon={<Users className="size-5" />}
              title="Role od startu"
              text="Panel rozroznia uprawnienia i porzadkuje dostep do waznych obszarow."
            />
            <FeatureTile
              icon={<Sword className="size-5" />}
              title="Miejsce na rozwoj"
              text="To dobry fundament pod postacie, watki i dalsze elementy rozgrywki."
            />
          </div>
        </div>
      </section>
      <section className="flex min-h-[640px] items-center justify-center">
        {children}
      </section>
      <div className="fixed left-6 top-6 z-20">
        <Button asChild size="sm" variant="secondary">
          <Link href="/">Wroc na strone glowna</Link>
        </Button>
      </div>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/70 p-5 backdrop-blur-sm">
      <div className="mb-4 inline-flex rounded-full bg-[color:var(--badge)] p-3 text-[color:var(--accent-strong)]">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-muted)]">
        {text}
      </p>
    </div>
  );
}
