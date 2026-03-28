"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CharacterForm } from "@/components/characters/character-form";
import { getApiErrorMessage, getCharacter } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function EditCharacterPage({
  params,
}: {
  params: Promise<{ charId: string }>;
}) {
  const router = useRouter();
  const { accessToken, hydrated } = useAuthStore((state) => state);
  const { charId } = use(params);

  const query = useQuery({
    queryKey: ["character-edit", charId],
    queryFn: () => getCharacter(charId),
    enabled: hydrated && Boolean(accessToken),
  });

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hydrated, router]);

  if (!hydrated || query.isLoading) {
    return (
      <div className="min-h-screen px-4 py-10 lg:px-8">
        <div className="mx-auto h-96 max-w-4xl animate-pulse rounded-[28px] bg-[color:var(--surface-strong)]" />
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="min-h-screen px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[28px] bg-[color:var(--card)] p-8">
          <p className="text-sm text-[#9d3d2d]">
            {query.isError ? getApiErrorMessage(query.error) : "Nie znaleziono postaci."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <CharacterForm character={query.data.character} mode="edit" />
      </div>
    </div>
  );
}
