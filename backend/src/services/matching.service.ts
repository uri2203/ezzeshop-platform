import { query, queryOne, withTransaction } from '../config/database';
import { NotFoundError } from '../utils/errors';
import type { Campaign, Creator, Match } from '../types';

interface ScoringResult {
  score: number;
  breakdown: Record<string, number>;
  reasoning: string;
}

function scoreMatch(campaign: Campaign, creator: Creator): ScoringResult {
  const breakdown: Record<string, number> = {};
  let total = 0;

  // Coincidencia de nicho (30 puntos)
  const campaignNiches = new Set(campaign.target_niches.map((n) => n.toLowerCase()));
  const creatorNiches = creator.niches.map((n) => n.toLowerCase());
  const nicheMatches = creatorNiches.filter((n) => campaignNiches.has(n)).length;
  const nicheScore = campaignNiches.size > 0 ? Math.min(30, (nicheMatches / campaignNiches.size) * 30) : 15;
  breakdown['niche'] = Math.round(nicheScore);
  total += nicheScore;

  // Coincidencia geográfica (25 puntos)
  const campaignCountries = new Set(campaign.target_countries.map((c) => c.toLowerCase()));
  if (campaignCountries.size === 0) {
    breakdown['geography'] = 20;
    total += 20;
  } else {
    const creatorCountries = creator.countries_audience.map((c) => c.toLowerCase());
    if (creator.primary_country && campaignCountries.has(creator.primary_country.toLowerCase())) {
      breakdown['geography'] = 25;
      total += 25;
    } else {
      const geoMatches = creatorCountries.filter((c) => campaignCountries.has(c)).length;
      const geoScore = Math.min(25, (geoMatches / campaignCountries.size) * 25);
      breakdown['geography'] = Math.round(geoScore);
      total += geoScore;
    }
  }

  // Presupuesto vs tarifa (20 puntos)
  const campaignBudgetPerCreator = campaign.budget_total * 0.8;
  const creatorMin = creator.min_campaign_budget;
  if (creatorMin === 0 || campaignBudgetPerCreator >= creatorMin) {
    const budgetScore = creatorMin === 0 ? 15 : Math.min(20, (campaignBudgetPerCreator / creatorMin) * 10);
    breakdown['budget'] = Math.round(budgetScore);
    total += budgetScore;
  } else {
    breakdown['budget'] = 0;
  }

  // Tamaño de audiencia (15 puntos)
  const audienceScore = Math.min(15, Math.log10(creator.avg_viewers + 1) * 3);
  breakdown['audience_size'] = Math.round(audienceScore);
  total += audienceScore;

  // Engagement rate (10 puntos)
  const engagementScore = Math.min(10, creator.engagement_rate * 2);
  breakdown['engagement'] = Math.round(engagementScore);
  total += engagementScore;

  const finalScore = Math.min(100, Math.round(total));

  const reasoningParts: string[] = [];
  if (breakdown['niche'] && breakdown['niche'] > 20) reasoningParts.push('excelente coincidencia de nicho');
  if (breakdown['geography'] && breakdown['geography'] > 18) reasoningParts.push('audiencia geográficamente alineada');
  if (breakdown['budget'] && breakdown['budget'] > 15) reasoningParts.push('presupuesto compatible');
  if (creator.avg_viewers > 10000) reasoningParts.push(`audiencia significativa (${creator.avg_viewers.toLocaleString()} viewers)`);
  if (creator.engagement_rate > 4) reasoningParts.push(`alto engagement (${creator.engagement_rate}%)`);

  return {
    score: finalScore,
    breakdown,
    reasoning: reasoningParts.length > 0
      ? `Match por: ${reasoningParts.join(', ')}.`
      : 'Match básico sin factores destacados.',
  };
}

export const matchingService = {
  async findMatches(campaignId: string): Promise<Match[]> {
    const campaign = await queryOne<Campaign>(
      'SELECT * FROM campaigns WHERE id = $1',
      [campaignId],
    );
    if (!campaign) throw new NotFoundError('Campaña');

    const creators = await query<Creator>(
      `SELECT c.* FROM creators c
       WHERE c.status = 'approved' AND c.onboarding_completed = true
       ORDER BY c.avg_viewers DESC LIMIT 100`,
    );

    const scored = creators
      .map((creator) => ({ creator, ...scoreMatch(campaign, creator) }))
      .filter((m) => m.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const matches = await withTransaction(async (client) => {
      const results: Match[] = [];
      for (const { creator, score, breakdown, reasoning } of scored) {
        const existing = await client.query<Match>(
          'SELECT id FROM matches WHERE campaign_id = $1 AND creator_id = $2',
          [campaignId, creator.id],
        );
        if (existing.rows[0]) continue;

        const res = await client.query<Match>(
          `INSERT INTO matches (campaign_id, creator_id, client_id, score, score_breakdown, ai_reasoning, proposed_budget)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            campaignId,
            creator.id,
            campaign.client_id,
            score,
            JSON.stringify(breakdown),
            reasoning,
            Math.min(campaign.budget_total * 0.3, creator.min_campaign_budget * 1.2),
          ],
        );
        if (res.rows[0]) results.push(res.rows[0]);
      }
      return results;
    });

    return matches;
  },

  async getMatchesForCampaign(campaignId: string): Promise<Match[]> {
    return query<Match>(
      `SELECT m.*, c.display_name as creator_name, c.avatar_url as creator_avatar,
              c.niches as creator_niches, c.avg_viewers, c.engagement_rate
       FROM matches m
       JOIN creators c ON m.creator_id = c.id
       WHERE m.campaign_id = $1
       ORDER BY m.score DESC`,
      [campaignId],
    );
  },

  async getMatchesForCreator(creatorId: string): Promise<Match[]> {
    return query<Match>(
      `SELECT m.*, camp.title as campaign_title, cl.company_name,
              cl.logo_url as client_logo
       FROM matches m
       JOIN campaigns camp ON m.campaign_id = camp.id
       JOIN clients cl ON m.client_id = cl.id
       WHERE m.creator_id = $1 AND m.status = 'pending'
       ORDER BY m.score DESC, m.created_at DESC`,
      [creatorId],
    );
  },

  async respondToMatch(
    matchId: string,
    creatorId: string,
    accept: boolean,
  ): Promise<Match> {
    const match = await queryOne<Match>(
      'SELECT * FROM matches WHERE id = $1 AND creator_id = $2',
      [matchId, creatorId],
    );
    if (!match) throw new NotFoundError('Match');

    const status = accept ? 'accepted' : 'rejected';
    const [updated] = await query<Match>(
      `UPDATE matches SET status = $1, creator_response_at = NOW(), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [status, matchId],
    );
    if (!updated) throw new Error('Error actualizando match');
    return updated;
  },
};
