-- Migration 002: Platform configuration table for admin API keys
-- PostgreSQL 16

CREATE TABLE IF NOT EXISTS platform_config (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key  VARCHAR(128) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  is_secret   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_config_key ON platform_config (config_key);

CREATE TRIGGER trg_platform_config_updated_at
  BEFORE UPDATE ON platform_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
