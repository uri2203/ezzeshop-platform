import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['client', 'creator']),
  locale: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const oauthSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  avatarUrl: z.string().url().optional(),
  provider: z.enum(['google', 'apple', 'facebook']),
  providerId: z.string().min(1),
  role: z.enum(['client', 'creator']).optional(),
});

const resetRequestSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = registerSchema.parse(req.body);
      const { user, tokens } = await authService.register(dto);
      res.status(201).json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name },
          ...tokens,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = loginSchema.parse(req.body);
      const { user, tokens } = await authService.login(dto);
      res.json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name, locale: user.locale },
          ...tokens,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async loginOAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = oauthSchema.parse(req.body);
      const { user, tokens, isNew } = await authService.loginOAuth(dto);
      res.status(isNew ? 201 : 200).json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name },
          isNew,
          ...tokens,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const tokens = await authService.refreshTokens(refreshToken);
      res.json({ success: true, data: tokens });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) await authService.logout(req.user.sub);
      res.json({ success: true, message: 'Sesión cerrada' });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false }); return; }
      const user = await authService.getProfile(req.user.sub);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = resetRequestSchema.parse(req.body);
      await authService.requestPasswordReset(email);
      res.json({ success: true, message: 'Si el email existe recibirás instrucciones' });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = resetSchema.parse(req.body);
      await authService.resetPassword(token, password);
      res.json({ success: true, message: 'Contraseña actualizada' });
    } catch (err) {
      next(err);
    }
  },
};
