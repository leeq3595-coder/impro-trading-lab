import { requireAdmin } from "@/lib/supabase/dal";
import MaterialsClient from "./MaterialsClient";

export default async function AdminMaterialsPage() {
  await requireAdmin();
  return <MaterialsClient />;
}
