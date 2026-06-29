import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../config/database';
import { matchingService } from '../services/matching.service';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import type { Campaign, Client } from '../types';

const campaignSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(2000).optional(),
  objective: z.enum(['brand_awareness', 'traffic', 'conversions', 'app_installs', 'reach']),
  adFormat: z.enum(['pre_roll', 'mid_roll', 'banner', 'sponsored_content', 'story']).default('pre_roll'),
  budgetTotal: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  targetCountries: z.array(z.string()).default([]),
  targetNiches: z.array(z.string()).default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  landingUrl: z.string().url().optional(),
  callToAction: z.string().max(100).optional(),
});

export const campaignsController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = campaignSchema.parse(req.body);
      const client = await queryOne<Client>('SELECT id FROM clients WHERE user_id = $1', [req.user!.sub]);
      if (!client) throw new ForbiddenError('Debes ser cliente para crear campañas');

      const [campaign] = await query<Campaign>(
        `INSERT INTO campaigns (client_id, title, description, objective, ad_format, budget_total, currency,
         target_countries, target_niches, start_date, end_date, landing_url, call_to_action)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          client.id, dto.title, dto.description ?? null, dto.objective, dto.adFormat,
          dto.budgetTotal, dto.currency, dto.targetCountries, dto.targetNiches,
          dto.startDate ?? null, dto.endDate ?? null, dto.landingUrl ?? null, dto.callToAction ?? null,
        ],
      );

      res.status(201).json({ success: true, data: campaign });
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = await queryOne<Client>('SELECT id FROM clients WHERE user_id = $1', [req.user!.sub]);
      if (!client) throw new ForbiddenError();
      const campaigns = await query<Campaign>('SELECT * FROM campaigns WHERE client_id = $1 ORDER BY created_at DESC', [client.id]);
      res.json({ success: true, data: campaigns });
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await queryOne<Campaign>('SELECT * FROM campaigns WHERE id = $1', [req.params['id']]);
      if (!campaign) throw new NotFoundError('Campaña');
      res.json({ success: true, data: campaign });
    } catch (err) { next(err); }
  },

  async findMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matches = await matchingService.findMatches(req.params['id'] ?? '');
      res.json({ success: true, data: matches, count: matches.length });
    } catch (err) { next(err); }
  },

  async getMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matches = await matchingService.getMatchesForCampaign(req.params['id'] ?? '');
      res.json({ success: true, data: matches });
    } catch (err) { next(err); }
  },
};
