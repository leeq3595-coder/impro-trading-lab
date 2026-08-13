import { requireAdmin } from "@/lib/supabase/dal";
import LinksClient from "./LinksClient";

export default async function AdminLinksPage() {
  await requireAdmin();
  return <LinksClient />;
}
