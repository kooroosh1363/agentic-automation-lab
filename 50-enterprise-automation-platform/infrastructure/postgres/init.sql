CREATE SCHEMA IF NOT EXISTS warehouse;

CREATE TABLE IF NOT EXISTS warehouse.requests (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  priority TEXT NOT NULL,
  category TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouse.dead_letter_queue (
  id BIGSERIAL PRIMARY KEY,
  raw_record JSONB NOT NULL,
  error_reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dlq_created_at_idx
  ON warehouse.dead_letter_queue (created_at DESC);
