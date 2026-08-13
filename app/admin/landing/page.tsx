import { requireAdmin } from "@/lib/supabase/dal";
import LandingClient from "./LandingClient";

export default async function AdminLandingPage() {
  const admin = await requireAdmin();
  return <LandingClient adminId={admin.id} />;
}
