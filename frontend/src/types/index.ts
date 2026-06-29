export interface StreamingContent {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  language: string;
  thumbnail_url: string | null;
  video_url: string | null;
  hls_url: string | null;
  duration_seconds: number | null;
  status: string;
  views: number;
  likes: number;
  ad_enabled: boolean;
  ad_revenue_earned: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  objective: string;
  ad_format: string;
  budget_total: number;
  budget_spent: number;
  currency: string;
  target_countries: string[];
  target_niches: string[];
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
}

export interface Creator {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  niches: string[];
  avg_viewers: number;
  engagement_rate: number;
  countries_audience: string[];
  ad_rate_per_1000: number;
  status: string;
}
