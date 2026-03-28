import { CharacterDetailShell } from "@/components/characters/character-detail-shell";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ charId: string }>;
}) {
  const { charId } = await params;

  return <CharacterDetailShell characterId={charId} />;
}
