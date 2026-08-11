-- Data Warehouse schema
CREATE SCHEMA IF NOT EXISTS warehouse;

CREATE TABLE IF NOT EXISTS warehouse.customers (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    source     TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dead-Letter Queue for invalid records
CREATE TABLE IF NOT EXISTS warehouse.dead_letter_queue (
    id         SERIAL PRIMARY KEY,
    raw_record JSONB NOT NULL,
    error_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operational source schema (for Extract Postgres)
CREATE SCHEMA IF NOT EXISTS ops;

CREATE TABLE IF NOT EXISTS ops.customers (
    customer_id   TEXT,
    full_name     TEXT,
    email_address TEXT
);

-- Sample operational data
INSERT INTO ops.customers (customer_id, full_name, email_address) VALUES
    ('c-001', 'Ali Rezaei', 'ali@example.com'),
    ('c-002', 'Maryam Ahmadi', 'maryam@example.com'),
    ('c-003', 'Broken Record', 'not-an-email');