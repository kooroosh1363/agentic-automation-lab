CREATE TABLE IF NOT EXISTS technicians (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    skills TEXT[] NOT NULL DEFAULT '{}',
    current_load INTEGER NOT NULL DEFAULT 0 CHECK (current_load >= 0),
    van_inventory TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO technicians (id, name, lat, lon, skills, current_load, van_inventory, status)
VALUES
    ('TECH-001', 'Sample Technician A', 35.7000, 51.4000, ARRAY['AC', 'Heater'], 2, ARRAY['freon', 'thermostat'], 'active'),
    ('TECH-002', 'Sample Technician B', 35.7500, 51.4500, ARRAY['AC', 'Refrigerator'], 0, ARRAY['compressor', 'freon'], 'active'),
    ('TECH-003', 'Sample Technician C', 35.6800, 51.3800, ARRAY['Heater'], 4, ARRAY['igniter'], 'active')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    lat = EXCLUDED.lat,
    lon = EXCLUDED.lon,
    skills = EXCLUDED.skills,
    current_load = EXCLUDED.current_load,
    van_inventory = EXCLUDED.van_inventory,
    status = EXCLUDED.status,
    updated_at = NOW();
