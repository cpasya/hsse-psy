import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { serverEnv } from "@/config/env";
import { logout } from "@/features/auth/api";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const env = serverEnv();
  if (req.headers.get("origin") !== new URL(env.NEXTAUTH_URL).origin)
    return NextResponse.json({ message: "Origin rejected" }, { status: 403 });
  const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });
  if (token?.refreshToken) {
    try {
      await logout(token.refreshToken);
    } catch {
      return NextResponse.json(
        {
          message:
            "The local session will end, but the backend session could not be revoked",
        },
        { status: 502 },
      );
    }
  }
  return NextResponse.json({ success: true });
}
