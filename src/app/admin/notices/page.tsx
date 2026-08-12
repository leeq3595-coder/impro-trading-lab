import { requireAdmin } from "@/lib/supabase/dal";
import NoticesClient from "./NoticesClient";

export default async function AdminNoticesPage() {
  const admin = await requireAdmin();
  return <NoticesClient adminId={admin.id} />;
}
