import { type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { query, queryOne } from '../config/database';
import { logger } from '../config/logger';

// Allowed keys — whitelist to prevent arbitrary env injection
const ALLOWED_KEYS = new Set([
  'ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SENDGRID_API_KEY',
  'EMAIL_FROM',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'CLOUDFLARE_R2_ACCESS_KEY',
  'CLOUDFLARE_R2_SECRET_KEY',
  'CLOUDFLARE_R2_BUCKET',
  'CLOUDFLARE_R2_ENDPOINT',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
]);

const ApiKeysSchema = z.record(z.string().max(8192)).refine(
  (obj) => Object.keys(obj).every((k) => ALLOWED_KEYS.has(k)),
  { message: 'Una o más keys no están permitidas' },
);

function encryptValue(value: string): string {
  const secret = process.env['CONFIG_ENCRYPTION_KEY'] ?? process.env['JWT_ACCESS_SECRET'] ?? 'fallback-key-32bytes-padding-!!!';
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `enc:${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptValue(stored: string): string {
  if (!stored.startsWith('enc:')) return stored;
  const secret = process.env['CONFIG_ENCRYPTION_KEY'] ?? process.env['JWT_ACCESS_SECRET'] ?? 'fallback-key-32bytes-padding-!!!';
  const key = crypto.createHash('sha256').update(secret).digest();
  const [, ivHex, encHex] = stored.split(':');
  const iv = Buffer.from(ivHex ?? '', 'hex');
  const enc = Buffer.from(encHex ?? '', 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

export async function getApiKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rows = await query<{ config_key: string; config_value: string; is_secret: boolean }>(
      `SELECT config_key, config_value, is_secret FROM platform_config ORDER BY config_key`,
    );

    const result: Record<string, string> = {};
    for (const row of rows) {
      // Return masked value for secrets, real value for non-secrets
      if (row.is_secret) {
        const real = row.config_value.startsWith('enc:') ? decryptValue(row.config_value) : row.config_value;
        result[row.config_key] = real.length > 8 ? `${real.slice(0, 4)}${'•'.repeat(20)}${real.slice(-4)}` : '••••••••';
      } else {
        result[row.config_key] = row.config_value;
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function upsertApiKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = ApiKeysSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0]?.message });
      return;
    }

    const SECRET_KEYS = new Set([
      'ANTHROPIC_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
      'SENDGRID_API_KEY', 'GOOGLE_CLIENT_SECRET',
      'CLOUDFLARE_R2_SECRET_KEY', 'FIREBASE_PRIVATE_KEY',
    ]);

    for (const [key, value] of Object.entries(parsed.data)) {
      if (!value.trim()) continue; // skip empty — don't overwrite existing

      const isSecret = SECRET_KEYS.has(key);
      const storedValue = isSecret ? encryptValue(value) : value;

      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM platform_config WHERE config_key = $1`,
        [key],
      );

      if (existing) {
        await query(
          `UPDATE platform_config SET config_value = $1, updated_at = NOW() WHERE config_key = $2`,
          [storedValue, key],
        );
      } else {
        await query(
          `INSERT INTO platform_config (config_key, config_value, is_secret) VALUES ($1, $2, $3)`,
          [key, storedValue, isSecret],
        );
      }

      // Hot-reload into process.env so the running instance picks it up immediately
      process.env[key] = value;
    }

    logger.info(`Admin updated API config keys: ${Object.keys(parsed.data).join(', ')}`);
    res.json({ success: true, message: 'Configuración guardada correctamente' });
  } catch (err) {
    next(err);
  }
}
