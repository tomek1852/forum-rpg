import { ProfileShell } from "@/components/profile/profile-shell";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <ProfileShell userId={userId} />;
}
