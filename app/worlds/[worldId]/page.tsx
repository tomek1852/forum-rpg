import { WorldLogShell } from "@/components/worlds/world-log-shell";

export default async function WorldLogPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = await params;

  return <WorldLogShell worldId={worldId} />;
}
