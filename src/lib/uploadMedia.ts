import { createClient } from "@/lib/supabase/client";

const MAX_FILE_MB = 50;

export async function uploadMediaFile(file: File, folder = "columns"): Promise<string> {
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`파일이 너무 커요 (최대 ${MAX_FILE_MB}MB).`);
  }
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "bin";
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${safeExt}`;

  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}
