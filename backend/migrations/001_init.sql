-- Drop tables if they exist (to ensure fresh schema)
DROP TABLE IF EXISTS public.region_values;
DROP TABLE IF EXISTS public.layers CASCADE;
DROP TABLE IF EXISTS public.regions CASCADE;

-- Create Layers/Metrics table
CREATE TABLE public.layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    color_theme VARCHAR(50) NOT NULL,
    suffix VARCHAR(50) DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE
);

-- Create Regions table (Fixed list of regions)
CREATE TABLE public.regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Normalized Data Table (Many-to-Many: Layer <-> Region)
CREATE TABLE public.region_values (
    id SERIAL PRIMARY KEY,
    layer_id INTEGER REFERENCES public.layers(id) ON DELETE CASCADE,
    region_id INTEGER REFERENCES public.regions(id) ON DELETE CASCADE,
    value INTEGER DEFAULT 0,
    UNIQUE(layer_id, region_id)
);

-- Seed initial regions (Ukraine ADM1)
INSERT INTO public.regions (name) VALUES
('Автономна Республіка Крим'), ('Вінницька область'), ('Волинська область'), ('Дніпропетровська область'), ('Донецька область'),
('Житомирська область'), ('Закарпатська область'), ('Запорізька область'), ('Івано-Франківська область'), ('Київська область'),
('Кіровоградська область'), ('Луганська область'), ('Львівська область'), ('Миколаївська область'), ('Одеська область'),
('Полтавська область'), ('Рівненська область'), ('Сумська область'), ('Тернопільська область'), ('Харківська область'),
('Херсонська область'), ('Хмельницька область'), ('Черкаська область'), ('Чернівецька область'), ('Чернігівська область'), ('м. Київ'), ('Севастополь')
ON CONFLICT (name) DO NOTHING;

-- Seed initial layers
INSERT INTO public.layers (name, slug, color_theme, suffix)
VALUES 
    ('Ветерани', 'veterans', 'blue', 'осіб'),
    ('Вакансії', 'vacancies', 'green', 'вакансій'),
    ('Рейтинг', 'rating', 'purple', 'балів')
ON CONFLICT (slug) DO NOTHING;
