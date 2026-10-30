import "server-only";

import type { JWT } from "next-auth/jwt";

import type { SessionAccessError } from "@/types";

import {
    AuthApiError,
    getProfile,
} from "@/features/auth/api";

import { ensureFresh } from "./token-rotation";

function deny(
    token: JWT,
    error: SessionAccessError,
): JWT {
    return {
        ...token,

        profile: {
            ...token.profile,
            permissions: [],
            isActive: false,
        },

        error,
    };
}

export async function loadEffectiveToken(
    input: JWT,
    forceRefresh = false,
): Promise<JWT> {
    if (!input.profile?.id || !input.refreshToken) {
        return {
            ...input,
            error: "RefreshAccessTokenError",
        };
    }

    if (input.error === "RefreshAccessTokenError") {
        return deny(input, input.error);
    }

    // ProfileUnavailable bersifat sementara.
    // Coba verifikasi ulang, jangan terkunci selamanya.
    let token = await ensureFresh(
        {
            ...input,
            error: undefined,
        },
        forceRefresh,
    );

    if (token.error) {
        return deny(
            token,
            "RefreshAccessTokenError",
        );
    }

    try {
        let profile;

        try {
            profile = await getProfile(
                token.accessToken,
            );
        } catch (error) {
            // Access token mungkin ditolak sebelum expiry lokal.
            if (
                !(error instanceof AuthApiError) ||
                error.statusCode !== 401
            ) {
                throw error;
            }

            token = await ensureFresh(token, true);

            if (token.error) {
                return deny(
                    token,
                    "RefreshAccessTokenError",
                );
            }

            profile = await getProfile(
                token.accessToken,
            );
        }

        if (profile.id !== input.profile.id) {
            return deny(
                token,
                "RefreshAccessTokenError",
            );
        }

        if (!profile.isActive) {
            return deny(
                {
                    ...token,
                    profile,
                },
                "AccountInactive",
            );
        }

        return {
            ...token,
            profile,
            error: undefined,
        };
    } catch (error) {
        return deny(
            token,

            error instanceof AuthApiError &&
                error.statusCode === 401
                ? "RefreshAccessTokenError"
                : "ProfileUnavailable",
        );
    }
}