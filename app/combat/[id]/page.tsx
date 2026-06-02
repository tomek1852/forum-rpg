import { CombatDetailShell } from "@/components/combat/combat-detail-shell";

export default async function CombatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CombatDetailShell encounterId={id} />;
}
