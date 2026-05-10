import { EventDetailShell } from "@/components/events/event-detail-shell";

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return <EventDetailShell eventId={eventId} />;
}
