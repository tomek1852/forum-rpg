import { CharacterForm } from "@/components/characters/character-form";

export default function NewCharacterPage() {
  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <CharacterForm mode="create" />
      </div>
    </div>
  );
}
