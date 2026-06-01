import { AdminUserDetail } from "@/components/admin/user-detail";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <AdminUserDetail userId={userId} />;
}
