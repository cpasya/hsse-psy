import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { serverEnv } from "@/config/env";
import { logout } from "@/features/auth/api";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const env = serverEnv();
  if (req.headers.get("origin") !== new URL(env.NEXTAUTH_URL).origin)
    return NextResponse.json({ message: "Origin ditolak" }, { status: 403 });
  const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });
  if (token?.refreshToken) {
    try {
      await logout(token.refreshToken);
    } catch {
      return NextResponse.json(
        {
          message:
            "Sesi lokal akan ditutup, tetapi pencabutan sesi backend gagal",
        },
        { status: 502 },
      );
    }
  }
  return NextResponse.json({ success: true });
}
