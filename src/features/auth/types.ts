import type { UserDTO } from "@/features/users/types";
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshTokenExpiresAt?: string;
}
export interface LoginResponseDTO extends AuthTokens {
  user: UserDTO;
}
export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}
