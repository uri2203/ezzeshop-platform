import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { query, queryOne } from '../config/database';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError, NotFoundError, ValidationError } from '../utils/errors';
import type { User, AuthTokens, UserRole } from '../types';

const BCRYPT_ROUNDS = 12;

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'creator';
  locale?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface OAuthDto {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  provider: 'google' | 'apple' | 'facebook';
  providerId: string;
  role?: 'client' | 'creator';
}

export const authService = {
  async register(dto: RegisterDto): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await queryOne<User>(
      'SELECT id FROM users WHERE email = $1',
      [dto.email.toLowerCase()],
    );
    if (existing) throw new ConflictError('Este email ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const [user] = await query<User>(
      `INSERT INTO users (email, password_hash, role, status, first_name, last_name, locale)
       VALUES ($1, $2, $3, 'pending_verification', $4, $5, $6)
       RETURNING *`,
      [dto.email.toLowerCase(), passwordHash, dto.role, dto.firstName, dto.lastName, dto.locale ?? 'es'],
    );

    if (!user) throw new Error('Error creando usuario');

    if (dto.role === 'client') {
      await query(
        `INSERT INTO clients (user_id, company_name) VALUES ($1, $2)`,
        [user.id, `Empresa de ${dto.firstName}`],
      );
    } else {
      await query(
        `INSERT INTO creators (user_id, display_name) VALUES ($1, $2)`,
        [user.id, `${dto.firstName} ${dto.lastName}`],
      );
    }

    const tokens = generateTokens(user.id, user.email, user.role);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await query('UPDATE users SET refresh_token_hash = $1 WHERE id = $2', [refreshHash, user.id]);

    // TODO: enviar email de verificación con verificationToken
    void verificationToken;

    return { user, tokens };
  },

  async login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE email = $1',
      [dto.email.toLowerCase()],
    );
    if (!user) throw new UnauthorizedError('Credenciales incorrectas');
    if (!user.password_hash) throw new UnauthorizedError('Usa el método de login con Google/Apple');
    if (user.status === 'suspended') throw new UnauthorizedError('Cuenta suspendida');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedError('Credenciales incorrectas');

    const tokens = generateTokens(user.id, user.email, user.role);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);

    await query(
      'UPDATE users SET refresh_token_hash = $1, last_login_at = NOW() WHERE id = $2',
      [refreshHash, user.id],
    );

    return { user, tokens };
  },

  async loginOAuth(dto: OAuthDto): Promise<{ user: User; tokens: AuthTokens; isNew: boolean }> {
    let user = await queryOne<User>(
      'SELECT * FROM users WHERE email = $1',
      [dto.email.toLowerCase()],
    );

    let isNew = false;
    if (!user) {
      isNew = true;
      const role: UserRole = dto.role ?? 'viewer';
      const [newUser] = await query<User>(
        `INSERT INTO users (email, role, status, auth_provider, provider_id, first_name, last_name, avatar_url, email_verified_at)
         VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [dto.email.toLowerCase(), role, dto.provider, dto.providerId, dto.firstName, dto.lastName, dto.avatarUrl ?? null],
      );
      user = newUser ?? null;
      if (!user) throw new Error('Error creando usuario OAuth');

      if (role === 'client') {
        await query('INSERT INTO clients (user_id, company_name) VALUES ($1, $2)', [user.id, `Empresa de ${dto.firstName}`]);
      } else if (role === 'creator') {
        await query('INSERT INTO creators (user_id, display_name) VALUES ($1, $2)', [user.id, `${dto.firstName} ${dto.lastName}`]);
      }
    } else {
      await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    }

    const tokens = generateTokens(user.id, user.email, user.role);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await query('UPDATE users SET refresh_token_hash = $1 WHERE id = $2', [refreshHash, user.id]);

    return { user, tokens, isNew };
  },

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token inválido');
    }

    const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [payload.sub]);
    if (!user?.refresh_token_hash) throw new UnauthorizedError('Sesión expirada');

    const valid = await bcrypt.compare(refreshToken, user.refresh_token_hash);
    if (!valid) throw new UnauthorizedError('Refresh token inválido');

    const tokens = generateTokens(user.id, user.email, user.role);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await query('UPDATE users SET refresh_token_hash = $1 WHERE id = $2', [refreshHash, user.id]);

    return tokens;
  },

  async logout(userId: string): Promise<void> {
    await query('UPDATE users SET refresh_token_hash = NULL WHERE id = $1', [userId]);
  },

  async requestPasswordReset(email: string): Promise<void> {
    const user = await queryOne<User>('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!user) return; // Silencioso para no revelar si existe

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2 WHERE id = $3',
      [token, expires, user.id],
    );

    // TODO: enviar email con token
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await queryOne<User>(
      `SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires_at > NOW()`,
      [token],
    );
    if (!user) throw new ValidationError('Token de reset inválido o expirado');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await query(
      `UPDATE users SET password_hash = $1, password_reset_token = NULL,
       password_reset_expires_at = NULL, refresh_token_hash = NULL WHERE id = $2`,
      [passwordHash, user.id],
    );
  },

  async getProfile(userId: string): Promise<User> {
    const user = await queryOne<User>(
      'SELECT id, email, role, status, first_name, last_name, avatar_url, locale, timezone, phone, country_code, email_verified_at, last_login_at, notification_preferences, created_at, updated_at FROM users WHERE id = $1',
      [userId],
    );
    if (!user) throw new NotFoundError('Usuario');
    return user;
  },
};
