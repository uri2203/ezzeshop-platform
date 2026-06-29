export type UserRole = 'client' | 'creator' | 'admin' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type AuthProvider = 'email' | 'google' | 'apple' | 'facebook';

export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  role: UserRole;
  status: UserStatus;
  auth_provider: AuthProvider;
  provider_id: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  locale: string;
  timezone: string;
  phone: string | null;
  country_code: string | null;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  refresh_token_hash: string | null;
  push_token: string | null;
  notification_preferences: NotificationPreferences;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface Client {
  id: string;
  user_id: string;
  company_name: string;
  company_website: string | null;
  industry: string | null;
  description: string | null;
  logo_url: string | null;
  monthly_budget: number | null;
  currency: string;
  target_countries: string[];
  target_niches: string[];
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  stripe_customer_id: string | null;
  total_spent: number;
  campaigns_count: number;
  onboarding_completed: boolean;
  ai_context: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Creator {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  niches: string[];
  content_types: string[];
  primary_language: string;
  primary_country: string | null;
  countries_audience: string[];
  avg_viewers: number;
  total_subscribers: number;
  monthly_views: number;
  engagement_rate: number;
  audience_age_range: Record<string, unknown>;
  audience_gender_split: Record<string, unknown>;
  social_links: Record<string, string>;
  ad_rate_per_1000: number;
  min_campaign_budget: number;
  stripe_account_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  featured: boolean;
  onboarding_completed: boolean;
  ai_context: Record<string, unknown>;
  total_earned: number;
  campaigns_count: number;
  created_at: Date;
  updated_at: Date;
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
  target_audience: Record<string, unknown>;
  start_date: Date | null;
  end_date: Date | null;
  ad_creative_url: string | null;
  landing_url: string | null;
  call_to_action: string | null;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  created_at: Date;
  updated_at: Date;
}

export interface Match {
  id: string;
  campaign_id: string;
  creator_id: string;
  client_id: string;
  score: number;
  score_breakdown: Record<string, number>;
  status: string;
  proposed_budget: number | null;
  agreed_budget: number | null;
  ai_reasoning: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AgentConversation {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  messages: AgentMessage[];
  context: Record<string, unknown>;
  summary: string | null;
  language: string;
  is_active: boolean;
  tokens_used: number;
  created_at: Date;
  updated_at: Date;
}

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
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
