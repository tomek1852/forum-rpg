import { PublicUser } from "../users/users.service";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: "access";
}

export interface RefreshTokenPayload extends Omit<AccessTokenPayload, "type"> {
  jti: string;
  type: "refresh";
}

export interface AuthResponse {
  user: PublicUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenTtl: string;
    refreshTokenTtl: string;
  };
}
