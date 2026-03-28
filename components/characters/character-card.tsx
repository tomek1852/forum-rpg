import Link from "next/link";
import { Character } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CharacterCard({
  character,
  editable = false,
}: {
  character: Character;
  editable?: boolean;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{character.name}</CardTitle>
            <CardDescription>{character.title ?? "Postac bez tytulu"}</CardDescription>
          </div>
          <Badge>{character.isPublic ? "Publiczna" : "Prywatna"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-[color:var(--foreground-muted)]">
          {character.summary ?? "Brak krotkiego opisu. Uzupelnij szczegoly postaci, aby lepiej prezentowala sie w profilu."}
        </p>
        <div className="flex gap-3 text-sm font-semibold">
          <Link
            className="text-[color:var(--accent-strong)]"
            href={`/character/${character.id}`}
          >
            Szczegoly
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
