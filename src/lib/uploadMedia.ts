import { createClient } from "@/lib/supabase/client";

const MAX_FILE_MB = 50;

// 클립보드에서 붙여넣은 이미지 등은 파일 이름에 확장자가 없는 경우가 많아서,
// (예: 이름이 "image"뿐이거나 blob), MIME 타입을 우선으로 확장자를 정해요.
// 확장자가 정확해야 RichContent가 이미지/영상으로 자동 인식해서 그려줘요.
const MIME_EXT_MAP: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/bmp": "bmp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
};

function resolveExtension(file: File): string {
  if (file.type && MIME_EXT_MAP[file.type]) return MIME_EXT_MAP[file.type];
  const fromName = file.name.includes(".") ? file.name.split(".").pop() : "";
  const safe = (fromName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (safe) return safe;
  if (file.type.startsWith("image/")) return "png";
  if (file.type.startsWith("video/")) return "mp4";
  return "bin";
}

export async function uploadMediaFile(file: File, folder = "columns"): Promise<string> {
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`파일이 너무 커요 (최대 ${MAX_FILE_MB}MB).`);
  }
  const supabase = createClient();
  const safeExt = resolveExtension(file);
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
