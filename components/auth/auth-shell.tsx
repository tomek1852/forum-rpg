import Link from "next/link";
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
    <div className="min-h-screen px-4 py-8 lg:px-8">
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)] lg:p-12">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(229,155,82,0.28),_transparent_62%)]" />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-10 text-center">
          <div className="space-y-6">
            <Badge>Forum RPG</Badge>
            <div className="space-y-4">
              <h1 className="mx-auto max-w-3xl font-display text-5xl leading-tight text-[color:var(--foreground)] sm:text-6xl">
                {title}
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                {description}
              </p>
            </div>
          </div>
          <div className="w-full max-w-xl">
            {children}
          </div>
        </div>
      </section>
      <div className="fixed left-6 top-6 z-20">
        <Button asChild size="sm" variant="secondary">
          <Link href="/">Wroc na strone glowna</Link>
        </Button>
      </div>
    </div>
  );
}
