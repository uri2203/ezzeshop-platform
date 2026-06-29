import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../config/database';
import { matchingService } from '../services/matching.service';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import type { Creator } from '../types';

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  bio: z.string().max(2000).optional(),
  niches: z.array(z.string()).optional(),
  contentTypes: z.array(z.string()).optional(),
  primaryLanguage: z.string().optional(),
  primaryCountry: z.string().length(2).optional(),
  countriesAudience: z.array(z.string()).optional(),
  avgViewers: z.number().int().min(0).optional(),
  totalSubscribers: z.number().int().min(0).optional(),
  monthlyViews: z.number().int().min(0).optional(),
  engagementRate: z.number().min(0).max(100).optional(),
  adRatePer1000: z.number().min(0).optional(),
  minCampaignBudget: z.number().min(0).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
});

export const creatorsController = {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creator = await queryOne<Creator>('SELECT * FROM creators WHERE user_id = $1', [req.user!.sub]);
      if (!creator) throw new NotFoundError('Perfil de creador');
      res.json({ success: true, data: creator });
    } catch (err) { next(err); }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = updateProfileSchema.parse(req.body);
      const creator = await queryOne<Creator>('SELECT id FROM creators WHERE user_id = $1', [req.user!.sub]);
      if (!creator) throw new ForbiddenError('No tienes perfil de creador');

      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      const fieldMap: Record<string, string> = {
        displayName: 'display_name', bio: 'bio', niches: 'niches',
        contentTypes: 'content_types', primaryLanguage: 'primary_language',
        primaryCountry: 'primary_country', countriesAudience: 'countries_audience',
        avgViewers: 'avg_viewers', totalSubscribers: 'total_subscribers',
        monthlyViews: 'monthly_views', engagementRate: 'engagement_rate',
        adRatePer1000: 'ad_rate_per_1000', minCampaignBudget: 'min_campaign_budget',
        socialLinks: 'social_links',
      };

      for (const [key, col] of Object.entries(fieldMap)) {
        const val = dto[key as keyof typeof dto];
        if (val !== undefined) {
          const isJsonb = ['socialLinks'].includes(key);
          fields.push(`${col} = $${idx++}${isJsonb ? '::jsonb' : ''}`);
          values.push(isJsonb ? JSON.stringify(val) : val);
        }
      }

      if (fields.length === 0) { res.json({ success: true, message: 'Sin cambios' }); return; }

      // Check onboarding completeness
      const requiredFields = ['display_name', 'niches', 'primary_country', 'avg_viewers'];
      const onboardingCheck = requiredFields.every((f) => {
        const dtoKey = Object.entries(fieldMap).find(([, col]) => col === f)?.[0];
        return dtoKey ? dto[dtoKey as keyof typeof dto] !== undefined : false;
      });
      if (onboardingCheck) {
        fields.push(`onboarding_completed = true`);
      }

      values.push(creator.id);
      const [updated] = await query<Creator>(
        `UPDATE creators SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
        values,
      );

      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },

  async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { niche, country, limit = '20', page = '1' } = req.query as Record<string, string>;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let sql = `SELECT id, display_name, bio, avatar_url, niches, countries_audience,
                        avg_viewers, engagement_rate, ad_rate_per_1000, total_subscribers
                 FROM creators WHERE status = 'approved'`;
      const params: unknown[] = [];
      let idx = 1;

      if (niche) { sql += ` AND $${idx++} = ANY(niches)`; params.push(niche); }
      if (country) { sql += ` AND $${idx++} = ANY(countries_audience)`; params.push(country); }

      sql += ` ORDER BY featured DESC, avg_viewers DESC LIMIT $${idx++} OFFSET $${idx}`;
      params.push(parseInt(limit), offset);

      const creators = await query<Creator>(sql, params);
      res.json({ success: true, data: creators });
    } catch (err) { next(err); }
  },

  async getPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creator = await queryOne<Creator>(
        `SELECT id, display_name, bio, avatar_url, banner_url, niches, content_types,
                primary_language, countries_audience, avg_viewers, total_subscribers,
                monthly_views, engagement_rate, social_links, ad_rate_per_1000, min_campaign_budget
         FROM creators WHERE id = $1 AND status = 'approved'`,
        [req.params['id']],
      );
      if (!creator) throw new NotFoundError('Creador');
      res.json({ success: true, data: creator });
    } catch (err) { next(err); }
  },

  async getMyMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creator = await queryOne<Creator>('SELECT id FROM creators WHERE user_id = $1', [req.user!.sub]);
      if (!creator) throw new ForbiddenError();
      const matches = await matchingService.getMatchesForCreator(creator.id);
      res.json({ success: true, data: matches });
    } catch (err) { next(err); }
  },

  async respondToMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accept } = z.object({ accept: z.boolean() }).parse(req.body);
      const creator = await queryOne<Creator>('SELECT id FROM creators WHERE user_id = $1', [req.user!.sub]);
      if (!creator) throw new ForbiddenError();
      const match = await matchingService.respondToMatch(req.params['matchId'] ?? '', creator.id, accept);
      res.json({ success: true, data: match });
    } catch (err) { next(err); }
  },
};
