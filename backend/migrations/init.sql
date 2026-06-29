-- EzzeShop Platform - Schema Completo
-- PostgreSQL 16

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===========================
-- TABLA: users
-- ===========================
CREATE TYPE user_role AS ENUM ('client', 'creator', 'admin', 'viewer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'apple', 'facebook');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role user_role NOT NULL DEFAULT 'viewer',
  status user_status NOT NULL DEFAULT 'pending_verification',
  auth_provider auth_provider NOT NULL DEFAULT 'email',
  provider_id VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  locale VARCHAR(10) NOT NULL DEFAULT 'es',
  timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
  phone VARCHAR(20),
  country_code CHAR(2),
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  refresh_token_hash VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires_at TIMESTAMPTZ,
  push_token TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_country ON users(country_code);

-- ===========================
-- TABLA: clients (marcas/anunciantes)
-- ===========================
CREATE TYPE client_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  company_website TEXT,
  industry VARCHAR(100),
  description TEXT,
  logo_url TEXT,
  monthly_budget DECIMAL(12, 2),
  currency CHAR(3) DEFAULT 'USD',
  target_countries TEXT[] DEFAULT '{}',
  target_niches TEXT[] DEFAULT '{}',
  target_audience_age_min INT,
  target_audience_age_max INT,
  target_audience_gender VARCHAR(20),
  plan client_plan NOT NULL DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  total_spent DECIMAL(12, 2) DEFAULT 0,
  campaigns_count INT DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  ai_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_industry ON clients(industry);
CREATE INDEX idx_clients_plan ON clients(plan);

-- ===========================
-- TABLA: creators (creadores de contenido)
-- ===========================
CREATE TYPE creator_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE content_type AS ENUM ('video', 'podcast', 'livestream', 'shorts');

CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  niches TEXT[] DEFAULT '{}',
  content_types content_type[] DEFAULT '{}',
  primary_language VARCHAR(10) DEFAULT 'es',
  primary_country CHAR(2),
  countries_audience TEXT[] DEFAULT '{}',
  avg_viewers INT DEFAULT 0,
  total_subscribers INT DEFAULT 0,
  monthly_views INT DEFAULT 0,
  engagement_rate DECIMAL(5, 2) DEFAULT 0,
  audience_age_range JSONB DEFAULT '{}'::jsonb,
  audience_gender_split JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  ad_rate_per_1000 DECIMAL(10, 2) DEFAULT 0,
  min_campaign_budget DECIMAL(10, 2) DEFAULT 0,
  stripe_account_id VARCHAR(255),
  status creator_status NOT NULL DEFAULT 'pending',
  featured BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  ai_context JSONB DEFAULT '{}'::jsonb,
  total_earned DECIMAL(12, 2) DEFAULT 0,
  campaigns_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_status ON creators(status);
CREATE INDEX idx_creators_niches ON creators USING GIN(niches);
CREATE INDEX idx_creators_countries ON creators USING GIN(countries_audience);
CREATE INDEX idx_creators_avg_viewers ON creators(avg_viewers DESC);

-- ===========================
-- TABLA: campaigns
-- ===========================
CREATE TYPE campaign_status AS ENUM ('draft', 'pending_review', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE campaign_objective AS ENUM ('brand_awareness', 'traffic', 'conversions', 'app_installs', 'reach');
CREATE TYPE ad_format AS ENUM ('pre_roll', 'mid_roll', 'banner', 'sponsored_content', 'story');

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  objective campaign_objective NOT NULL,
  ad_format ad_format NOT NULL DEFAULT 'pre_roll',
  budget_total DECIMAL(12, 2) NOT NULL,
  budget_spent DECIMAL(12, 2) DEFAULT 0,
  currency CHAR(3) DEFAULT 'USD',
  cpm_target DECIMAL(8, 2),
  target_countries TEXT[] DEFAULT '{}',
  target_niches TEXT[] DEFAULT '{}',
  target_audience JSONB DEFAULT '{}'::jsonb,
  start_date DATE,
  end_date DATE,
  ad_creative_url TEXT,
  ad_creative_type VARCHAR(20),
  landing_url TEXT,
  call_to_action VARCHAR(100),
  status campaign_status NOT NULL DEFAULT 'draft',
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  ctr DECIMAL(5, 4) DEFAULT 0,
  ai_suggestions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_client_id ON campaigns(client_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- ===========================
-- TABLA: matches (cliente-creador)
-- ===========================
CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  score DECIMAL(5, 2) NOT NULL,
  score_breakdown JSONB DEFAULT '{}'::jsonb,
  status match_status NOT NULL DEFAULT 'pending',
  proposed_budget DECIMAL(10, 2),
  agreed_budget DECIMAL(10, 2),
  deliverables TEXT,
  notes TEXT,
  ai_reasoning TEXT,
  creator_response_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, creator_id)
);

CREATE INDEX idx_matches_campaign_id ON matches(campaign_id);
CREATE INDEX idx_matches_creator_id ON matches(creator_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_score ON matches(score DESC);

-- ===========================
-- TABLA: transactions
-- ===========================
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'campaign_payment', 'creator_earning', 'platform_fee', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  match_id UUID REFERENCES matches(id),
  campaign_id UUID REFERENCES campaigns(id),
  type transaction_type NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  status transaction_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ===========================
-- TABLA: agent_conversations
-- ===========================
CREATE TYPE conversation_type AS ENUM ('onboarding_client', 'onboarding_creator', 'campaign_wizard', 'support', 'general');

CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type conversation_type NOT NULL DEFAULT 'general',
  title VARCHAR(255),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  summary TEXT,
  language VARCHAR(10) DEFAULT 'es',
  is_active BOOLEAN DEFAULT TRUE,
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON agent_conversations(user_id);
CREATE INDEX idx_conversations_type ON agent_conversations(type);
CREATE INDEX idx_conversations_active ON agent_conversations(is_active);

-- ===========================
-- TABLA: streaming_content (EzzeTV)
-- ===========================
CREATE TYPE content_status AS ENUM ('uploading', 'processing', 'published', 'archived', 'rejected');
CREATE TYPE content_category AS ENUM (
  'entertainment', 'gaming', 'music', 'sports', 'news',
  'education', 'tech', 'lifestyle', 'cooking', 'travel',
  'beauty', 'fitness', 'business', 'art', 'comedy'
);

CREATE TABLE streaming_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category content_category NOT NULL,
  tags TEXT[] DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'es',
  thumbnail_url TEXT,
  video_url TEXT,
  hls_url TEXT,
  duration_seconds INT,
  file_size_bytes BIGINT,
  resolution VARCHAR(20),
  status content_status NOT NULL DEFAULT 'uploading',
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  ad_enabled BOOLEAN DEFAULT TRUE,
  ad_revenue_earned DECIMAL(10, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_creator_id ON streaming_content(creator_id);
CREATE INDEX idx_content_status ON streaming_content(status);
CREATE INDEX idx_content_category ON streaming_content(category);
CREATE INDEX idx_content_views ON streaming_content(views DESC);
CREATE INDEX idx_content_tags ON streaming_content USING GIN(tags);
CREATE INDEX idx_content_search ON streaming_content USING GIN(to_tsvector('simple', title || ' ' || COALESCE(description, '')));

-- ===========================
-- TABLA: viewing_sessions
-- ===========================
CREATE TABLE viewing_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES streaming_content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_token VARCHAR(255),
  watch_duration_seconds INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  ads_shown INT DEFAULT 0,
  ads_clicked INT DEFAULT 0,
  device_type VARCHAR(50),
  country_code CHAR(2),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_content_id ON viewing_sessions(content_id);
CREATE INDEX idx_sessions_user_id ON viewing_sessions(user_id);
CREATE INDEX idx_sessions_created_at ON viewing_sessions(created_at DESC);

-- ===========================
-- TABLA: ad_placements
-- ===========================
CREATE TABLE ad_placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewing_session_id UUID NOT NULL REFERENCES viewing_sessions(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  match_id UUID REFERENCES matches(id),
  shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT FALSE,
  watch_time_seconds INT DEFAULT 0,
  revenue_generated DECIMAL(8, 4) DEFAULT 0
);

CREATE INDEX idx_placements_session_id ON ad_placements(viewing_session_id);
CREATE INDEX idx_placements_campaign_id ON ad_placements(campaign_id);

-- ===========================
-- FUNCIÓN: updated_at automático
-- ===========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'clients', 'creators', 'campaigns',
    'matches', 'transactions', 'agent_conversations',
    'streaming_content', 'viewing_sessions'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END;
$$;

-- ===========================
-- DATOS INICIALES
-- ===========================
INSERT INTO users (id, email, password_hash, role, status, first_name, last_name, locale, email_verified_at)
VALUES (
  uuid_generate_v4(),
  'admin@ezzeshop.com',
  '$2b$12$placeholder_hash_change_on_first_run',
  'admin',
  'active',
  'Admin',
  'EzzeShop',
  'es',
  NOW()
);
