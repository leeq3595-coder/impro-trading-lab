import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  // 관리자 아니면 여기서 /admin/login으로 리다이렉트됨
  await requireAdmin();

  const supabase = await createClient();
  const { data: members, error } = await supabase
    .from("profiles")
    .select(
      "nickname, email, phone, phone_verified, role, is_vip, vip_since, olympe_uid, olympe_uid_confirmed, points_total, points_month, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(`회원 목록을 불러오지 못했어요: ${error.message}`, {
      status: 500,
    });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("회원목록");

  sheet.columns = [
    { header: "닉네임", key: "nickname", width: 16 },
    { header: "이메일(아이디)", key: "email", width: 26 },
    { header: "휴대폰번호", key: "phone", width: 16 },
    { header: "휴대폰인증", key: "phone_verified", width: 12 },
    { header: "등급", key: "role", width: 10 },
    { header: "VIP여부", key: "is_vip", width: 10 },
    { header: "VIP전환일", key: "vip_since", width: 20 },
    { header: "올림프UID", key: "olympe_uid", width: 16 },
    { header: "UID확인여부", key: "olympe_uid_confirmed", width: 12 },
    { header: "누적포인트", key: "points_total", width: 12 },
    { header: "이번달포인트", key: "points_month", width: 12 },
    { header: "가입일", key: "created_at", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const m of members ?? []) {
    sheet.addRow({
      nickname: m.nickname,
      email: m.email,
      phone: m.phone,
      phone_verified: m.phone_verified ? "O" : "X",
      role: m.role === "admin" ? "관리자" : "일반회원",
      is_vip: m.is_vip ? "VIP" : "일반",
      vip_since: m.vip_since ? new Date(m.vip_since).toLocaleString("ko-KR") : "",
      olympe_uid: m.olympe_uid ?? "",
      olympe_uid_confirmed: m.olympe_uid_confirmed ? "O" : "X",
      points_total: m.points_total,
      points_month: m.points_month,
      created_at: new Date(m.created_at).toLocaleString("ko-KR"),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `임프로트레이딩랩_회원목록_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        filename
      )}"`,
    },
  });
}
