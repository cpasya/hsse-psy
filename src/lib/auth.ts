import type { NextAuthOptions } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

import { login } from "@/features/auth/api";
import { loginSchema } from "@/features/auth/schemas";

import { loadEffectiveToken } from "./session-access";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "HSSE",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const input =
          loginSchema.safeParse(credentials);

        if (!input.success) {
          throw new Error(
            "Email atau password tidak valid",
          );
        }

        const data = await login(input.data);

        return {
          id: data.user.id,
          profile: data.user,

          accessToken: data.accessToken,
          refreshToken: data.refreshToken,

          expiresIn: data.expiresIn,

          refreshTokenExpiresAt:
            data.refreshTokenExpiresAt,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Profil ini sudah diverifikasi lewat /me saat login.
        return {
          ...token,

          profile: user.profile,

          accessToken: user.accessToken,
          refreshToken: user.refreshToken,

          accessTokenExpires:
            Date.now() + user.expiresIn * 1000,

          refreshTokenExpiresAt:
            user.refreshTokenExpiresAt,

          error: undefined,
        };
      }

      // Session read/update selalu memverifikasi ke backend.
      // Tidak memakai permission yang dikirim browser.
      return loadEffectiveToken(
        token,
        false,
        trigger === "update",
      );
    },

    async session({ session, token }) {
      session.user = token.profile;
      session.error = token.error;

      // Access/refresh token tidak diekspos di sini.
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (
        url.startsWith("/") &&
        !url.startsWith("//")
      ) {
        return baseUrl + url;
      }

      try {
        if (
          new URL(url).origin ===
          new URL(baseUrl).origin
        ) {
          return url;
        }
      } catch {
        // Fallback same-origin.
      }

      return baseUrl + "/dashboard";
    },
  },
};
