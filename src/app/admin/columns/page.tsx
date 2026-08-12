import { requireAdmin } from "@/lib/supabase/dal";
import ColumnsClient from "./ColumnsClient";

export default async function AdminColumnsPage() {
  const admin = await requireAdmin();
  return <ColumnsClient adminId={admin.id} />;
}
