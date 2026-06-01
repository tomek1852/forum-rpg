import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Character, CharacterBadge } from "@/lib/types";

export function CharacterCard({
  character,
  editable = false,
  expRank,
  phRank,
  badges,
}: {
  character: Character;
  editable?: boolean;
  expRank?: number;
  phRank?: number;
  badges?: CharacterBadge[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{character.name}</CardTitle>
            <CardDescription>
              {character.title ?? "Postać bez tytułu"}
              {character.world ? ` • ${character.world.name}` : ""}
            </CardDescription>
          </div>
          <Badge>{character.isPublic ? "Publiczna" : "Prywatna"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-[color:var(--foreground-muted)]">
          {character.summary ??
            "Brak krótkiego opisu. Uzupełnij szczegóły postaci, aby lepiej prezentowała się w profilu."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge>EXP: {character.experiencePoints}</Badge>
          {expRank !== undefined && <Badge className="border border-current bg-transparent">#{expRank} EXP</Badge>}
          <Badge>PH: {character.heroPoints}</Badge>
          {phRank !== undefined && <Badge className="border border-current bg-transparent">#{phRank} PH</Badge>}
        </div>
        {badges && badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((cb) => (
              <span
                key={cb.id}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--surface)] text-base ring-1 ring-[color:var(--border)]"
                title={`${cb.badge.name}: ${cb.badge.description}`}
              >
                {cb.badge.icon}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex gap-3 text-sm font-semibold">
          <Link className="text-[color:var(--accent-strong)]" href={`/character/${character.id}`}>
            Szczegóły
          </Link>
          {editable ? (
            <Link
              className="text-[color:var(--accent-strong)]"
              href={`/character/${character.id}/edit`}
            >
              Edytuj
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
