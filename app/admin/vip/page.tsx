import { requireAdmin } from "@/lib/supabase/dal";
import VipClient from "./VipClient";

export default async function AdminVipPage() {
  await requireAdmin();
  return <VipClient />;
}
