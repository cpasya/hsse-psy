import "server-only";
import { createHash } from "node:crypto";
import type { JWT } from "next-auth/jwt";
import { refreshToken } from "@/features/auth/api";
const inFlight = new Map<string, Promise<JWT>>();
const recent = new Map<string, { token: JWT; until: number }>();
export async function ensureFresh(token: JWT, force = false): Promise<JWT> {
  if (token.error) return token;
  if (!token.refreshToken)
    return { ...token, error: "RefreshAccessTokenError" };
  if (token.refreshTokenExpiresAt) {
    const expiry = Date.parse(token.refreshTokenExpiresAt);
    if (!Number.isFinite(expiry) || Date.now() >= expiry)
      return { ...token, error: "RefreshAccessTokenError" };
  }
  if (!force && Date.now() < token.accessTokenExpires - 30000) return token;
  for (const [key, value] of recent)
    if (value.until <= Date.now()) recent.delete(key);
  while (recent.size >= 1000) {
    const first = recent.keys().next().value;
    if (first === undefined) break;
    recent.delete(first);
  }
  const key = createHash("sha256").update(token.refreshToken).digest("hex");
  const cached = recent.get(key);
  if (
    cached &&
    Date.now() < cached.token.accessTokenExpires - 30000 &&
    (!force || cached.token.accessToken !== token.accessToken)
  )
    return cached.token;
  const pending = inFlight.get(key);
  if (pending) return pending;
  const promise = (async (): Promise<JWT> => {
    try {
      const t = await refreshToken(token.refreshToken);
      const next: JWT = {
        ...token,
        ...t,
        accessTokenExpires: Date.now() + t.expiresIn * 1000,
        refreshTokenExpiresAt:
          t.refreshTokenExpiresAt ?? token.refreshTokenExpiresAt,
        error: undefined,
      };
      recent.set(key, { token: next, until: next.accessTokenExpires });
      return next;
    } catch {
      return { ...token, error: "RefreshAccessTokenError" };
    }
  })();
  inFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}
