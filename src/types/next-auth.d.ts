import type { UserDTO } from "@/features/users/types";
import type { SessionAccessError } from "@/types";

declare module "next-auth" {
  interface Session {
    user: UserDTO;
    error?: SessionAccessError;
  }

  interface User {
    profile: UserDTO;

    accessToken: string;
    refreshToken: string;

    expiresIn: number;

    refreshTokenExpiresAt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    profile: UserDTO;

    accessToken: string;
    refreshToken: string;

    accessTokenExpires: number;

    refreshTokenExpiresAt?: string;

    error?: SessionAccessError;
  }
}