-- Migration: 002_raion_support.sql
-- Adds support for districts (raions) and hierarchical data aggregation

-- 1. Create Raions table
CREATE TABLE IF NOT EXISTS public.raions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_region_id INTEGER REFERENCES public.regions (id) ON DELETE CASCADE,
    UNIQUE (name, parent_region_id)
);

-- 2. Create Raion Values table (for district-level metrics)
CREATE TABLE IF NOT EXISTS public.raion_values (
    id SERIAL PRIMARY KEY,
    raion_id INTEGER REFERENCES public.raions (id) ON DELETE CASCADE,
    layer_id INTEGER REFERENCES public.layers (id) ON DELETE CASCADE,
    value INTEGER DEFAULT 0,
    period DATE DEFAULT CURRENT_DATE,
    UNIQUE (raion_id, layer_id, period)
);

-- 3. Index for performance on aggregation
CREATE INDEX IF NOT EXISTS idx_raion_parent ON public.raions (parent_region_id);

CREATE INDEX IF NOT EXISTS idx_raion_values_lookup ON public.raion_values (raion_id, layer_id, period);