-- Create tables if they don't exist (persistence-friendly)

-- Create Layers/Metrics table
CREATE TABLE IF NOT EXISTS public.layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    color_theme VARCHAR(50) NOT NULL,
    suffix VARCHAR(50) DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE
);

-- Create Regions table (Fixed list of regions)
CREATE TABLE IF NOT EXISTS public.regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Normalized Data Table (Many-to-Many: Layer <-> Region)
CREATE TABLE IF NOT EXISTS public.region_values (
    id SERIAL PRIMARY KEY,
    layer_id INTEGER REFERENCES public.layers (id) ON DELETE CASCADE,
    region_id INTEGER REFERENCES public.regions (id) ON DELETE CASCADE,
    value INTEGER DEFAULT 0,
    period DATE DEFAULT CURRENT_DATE,
    UNIQUE (layer_id, region_id, period)
);

-- Seed initial regions (Ukraine ADM1)
INSERT INTO
    public.regions (name)
VALUES ('Автономна Республіка Крим'),
    ('Вінницька область'),
    ('Волинська область'),
    ('Дніпропетровська область'),
    ('Донецька область'),
    ('Житомирська область'),
    ('Закарпатська область'),
    ('Запорізька область'),
    ('Івано-Франківська область'),
    ('Київська область'),
    ('Кіровоградська область'),
    ('Луганська область'),
    ('Львівська область'),
    ('Миколаївська область'),
    ('Одеська область'),
    ('Полтавська область'),
    ('Рівненська область'),
    ('Сумська область'),
    ('Тернопільська область'),
    ('Харківська область'),
    ('Херсонська область'),
    ('Хмельницька область'),
    ('Черкаська область'),
    ('Чернівецька область'),
    ('Чернігівська область'),
    ('м. Київ'),
    ('Севастополь')
ON CONFLICT (name) DO NOTHING;

-- Seed initial layers
INSERT INTO
    public.layers (
        name,
        slug,
        color_theme,
        suffix
    )
VALUES (
        'Ветерани',
        'veterans',
        'blue',
        'осіб'
    ),
    (
        'Вакансії',
        'vacancies',
        'green',
        'вакансій'
    ),
    (
        'Рейтинг',
        'rating',
        'purple',
        'балів'
    )
ON CONFLICT (slug) DO NOTHING;

-- Seed historical data for trends
INSERT INTO
    public.region_values (
        layer_id,
        region_id,
        value,
        period
    )
SELECT l.id, r.id, 5000 + (random() * 2000)::int, '2023-08-01'::date
FROM layers l, regions r
WHERE
    l.slug = 'veterans'
    AND r.name IN (
        'Київська область',
        'Львівська область',
        'Дніпропетровська область'
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.region_values (
        layer_id,
        region_id,
        value,
        period
    )
SELECT l.id, r.id, 5200 + (random() * 2000)::int, '2023-09-01'::date
FROM layers l, regions r
WHERE
    l.slug = 'veterans'
    AND r.name IN (
        'Київська область',
        'Львівська область',
        'Дніпропетровська область'
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.region_values (
        layer_id,
        region_id,
        value,
        period
    )
SELECT l.id, r.id, 5400 + (random() * 2000)::int, '2023-10-01'::date
FROM layers l, regions r
WHERE
    l.slug = 'veterans'
    AND r.name IN (
        'Київська область',
        'Львівська область',
        'Дніпропетровська область'
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.region_values (
        layer_id,
        region_id,
        value,
        period
    )
SELECT l.id, r.id, 5800 + (random() * 2000)::int, '2023-11-01'::date
FROM layers l, regions r
WHERE
    l.slug = 'veterans'
    AND r.name IN (
        'Київська область',
        'Львівська область',
        'Дніпропетровська область'
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.region_values (
        layer_id,
        region_id,
        value,
        period
    )
SELECT l.id, r.id, 6100 + (random() * 2000)::int, '2023-12-01'::date
FROM layers l, regions r
WHERE
    l.slug = 'veterans'
    AND r.name IN (
        'Київська область',
        'Львівська область',
        'Дніпропетровська область'
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    public.region_values (
        layer_id,
        region_id,
        value,
        period
    )
SELECT l.id, r.id, 6500 + (random() * 2000)::int, '2024-01-01'::date
FROM layers l, regions r
WHERE
    l.slug = 'veterans'
    AND r.name IN (
        'Київська область',
        'Львівська область',
        'Дніпропетровська область'
    )
ON CONFLICT DO NOTHING;