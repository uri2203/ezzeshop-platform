import jwt from 'jsonwebtoken';
import type { JwtPayload, AuthTokens, UserRole } from '../types';

const ACCESS_SECRET = process.env['JWT_SECRET'] ?? 'fallback_dev_secret_change_me';
const REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] ?? 'fallback_refresh_secret_change_me';
const ACCESS_EXPIRES = process.env['JWT_EXPIRES_IN'] ?? '15m';
const REFRESH_EXPIRES = process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d';

export function generateTokens(userId: string, email: string, role: UserRole): AuthTokens {
  const payload = { sub: userId, email, role };

  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
  const refreshToken = jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions);

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60,
  };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string };
}
