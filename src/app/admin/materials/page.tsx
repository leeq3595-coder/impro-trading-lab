import { requireAdmin } from "@/lib/supabase/dal";
import MaterialsClient from "./MaterialsClient";

export default async function AdminMaterialsPage() {
  const admin = await requireAdmin();
  return <MaterialsClient adminId={admin.id} />;
}
