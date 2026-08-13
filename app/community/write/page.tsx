import { requireMember } from "@/lib/supabase/dal";
import WriteClient from "./WriteClient";

export default async function CommunityWritePage() {
  await requireMember();
  return <WriteClient />;
}
