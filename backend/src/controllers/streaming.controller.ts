import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import type { StreamingContent, Creator } from '../types';

const createContentSchema = z.object({
  title: z.string().min(3).max(500),
  description: z.string().max(5000).optional(),
  category: z.enum([
    'entertainment', 'gaming', 'music', 'sports', 'news',
    'education', 'tech', 'lifestyle', 'cooking', 'travel',
    'beauty', 'fitness', 'business', 'art', 'comedy',
  ]),
  tags: z.array(z.string()).max(10).default([]),
  language: z.string().default('es'),
  adEnabled: z.boolean().default(true),
});

const updateViewingSchema = z.object({
  sessionToken: z.string(),
  watchDuration: z.number().int().min(0),
  completed: z.boolean().default(false),
});

export const streamingController = {
  async listContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, search, limit = '20', page = '1' } = req.query as Record<string, string>;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let sql = `SELECT sc.*, c.display_name as creator_name, c.avatar_url as creator_avatar
                 FROM streaming_content sc
                 JOIN creators c ON sc.creator_id = c.id
                 WHERE sc.status = 'published'`;
      const params: unknown[] = [];
      let idx = 1;

      if (category) { sql += ` AND sc.category = $${idx++}`; params.push(category); }
      if (search) {
        sql += ` AND to_tsvector('simple', sc.title || ' ' || COALESCE(sc.description, '')) @@ plainto_tsquery('simple', $${idx++})`;
        params.push(search);
      }

      sql += ` ORDER BY sc.views DESC, sc.published_at DESC LIMIT $${idx++} OFFSET $${idx}`;
      params.push(parseInt(limit), offset);

      const content = await query<StreamingContent>(sql, params);
      res.json({ success: true, data: content });
    } catch (err) { next(err); }
  },

  async getContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const content = await queryOne<StreamingContent>(
        `SELECT sc.*, c.display_name as creator_name, c.avatar_url as creator_avatar,
                c.niches as creator_niches
         FROM streaming_content sc
         JOIN creators c ON sc.creator_id = c.id
         WHERE sc.id = $1 AND sc.status = 'published'`,
        [req.params['id']],
      );
      if (!content) throw new NotFoundError('Contenido');

      // Incrementar views async
      void query('UPDATE streaming_content SET views = views + 1 WHERE id = $1', [req.params['id']]);

      res.json({ success: true, data: content });
    } catch (err) { next(err); }
  },

  async createContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = createContentSchema.parse(req.body);
      const creator = await queryOne<Creator>('SELECT id FROM creators WHERE user_id = $1', [req.user!.sub]);
      if (!creator) throw new ForbiddenError('Solo los creadores pueden subir contenido');

      const [content] = await query<StreamingContent>(
        `INSERT INTO streaming_content (creator_id, title, description, category, tags, language, ad_enabled, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'uploading')
         RETURNING *`,
        [creator.id, dto.title, dto.description ?? null, dto.category, dto.tags, dto.language, dto.adEnabled],
      );

      res.status(201).json({ success: true, data: content });
    } catch (err) { next(err); }
  },

  async myContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creator = await queryOne<Creator>('SELECT id FROM creators WHERE user_id = $1', [req.user!.sub]);
      if (!creator) throw new ForbiddenError();
      const content = await query<StreamingContent>(
        'SELECT * FROM streaming_content WHERE creator_id = $1 ORDER BY created_at DESC',
        [creator.id],
      );
      res.json({ success: true, data: content });
    } catch (err) { next(err); }
  },

  async startViewingSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contentId = req.params['id'];
      const userId = req.user?.sub ?? null;

      const sessionToken = crypto.randomUUID();
      const [session] = await query(
        `INSERT INTO viewing_sessions (content_id, user_id, session_token, device_type, country_code)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, session_token`,
        [contentId, userId, sessionToken, req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop', null],
      );

      res.json({ success: true, data: session });
    } catch (err) { next(err); }
  },

  async updateViewingSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionToken, watchDuration, completed } = updateViewingSchema.parse(req.body);
      await query(
        'UPDATE viewing_sessions SET watch_duration_seconds = $1, completed = $2, updated_at = NOW() WHERE session_token = $3',
        [watchDuration, completed, sessionToken],
      );
      res.json({ success: true });
    } catch (err) { next(err); }
  },
};
