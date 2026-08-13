import { requireAdmin } from "@/lib/supabase/dal";
import CommunityAdminClient from "./CommunityAdminClient";

export default async function AdminCommunityPage() {
  const admin = await requireAdmin();
  return <CommunityAdminClient adminId={admin.id} adminNickname={admin.nickname} />;
}
