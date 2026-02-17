const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Load environment variables (Note: docker-compose handles this, but for local dev verify process.env)
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "map_data",
  password: process.env.DB_PASSWORD, // Must be set via env
  port: process.env.DB_PORT || 5432,
});

// Basic Auth Middleware
const authMiddleware = (req, res, next) => {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD env variable is not set!");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization required" });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Basic" || !token) {
    return res.status(401).json({ error: "Invalid authorization scheme" });
  }

  // Decode base64 credentials (username:password)
  const credentials = Buffer.from(token, "base64").toString("utf-8");
  const [username, password] = credentials.split(":");

  // Simple password check (username ignored for now, could enforce 'admin')
  if (password !== adminPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  next();
};

// Initialize Database
async function initDB() {
  try {
    const migrationsDir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await pool.query(sql);
    }
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

// Run init on startup
initDB();


// Verify Admin Credentials (Protected)
app.get("/api/verify-admin", authMiddleware, (req, res) => {
  res.json({ status: "ok" });
});

// --- AI Assistant Bridge (Gemini) ---
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }) : null;

const SYSTEM_PROMPT = `
Ти — Aura, інтелектуальна асистентка для веб-додатку "Інтерактивна Карта України".
Твоя мета: допомагати користувачам аналізувати дані на карті, пояснювати статистику регіонів та відповідати на питання про Україну.

Контекст додатка:
- Карта відображає різні метрики (Ветеранська політика, Вакансії, Рейтинги тощо) по областях України.
- Дані оновлюються в реальному часі адміністраторами.

Твій стиль:
- Дружній, професійний, лаконічний.
- Спілкуйся українською мовою.
- Якщо ти не маєш конкретних даних про певний регіон прямо зараз — відповідай загальну інформацію або спрямовуй користувача на вибір відповідної метрики в меню.

Ти — частина преміального продукту. Твої відповіді мають бути чіткими та корисними.
`;

// Helper to build context from DB - Always latest data
async function getDatabaseContext() {
  try {
    const statsRes = await pool.query(`
      SELECT DISTINCT ON (l.id, r.id)
        l.name as metric,
        r.name as region,
        rv.value,
        rv.period,
        l.suffix
      FROM region_values rv
      JOIN layers l ON rv.layer_id = l.id
      JOIN regions r ON rv.region_id = r.id
      WHERE l.is_active = true
      ORDER BY l.id, r.id, rv.period DESC
    `);

    let contextText = "Ось найактуальніші дані з бази даних:\n";
    statsRes.rows.forEach(row => {
      const period = new Date(row.period).toISOString().split('T')[0];
      contextText += `- ${row.metric} у регіоні "${row.region}": ${row.value} ${row.suffix} (станом на ${period}).\n`;
    });

    return contextText;
  } catch (err) {
    console.error("Context fetch error:", err);
    return "Дані з бази тимчасово недоступні.";
  }
}

// POST /api/chat - Bridge to Gemini with Context
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  console.log(`[AI Request]: ${message}`);

  if (!model) {
    return res.json({
      response: "Я Aura! Вибачте, але менй API Key ще не налаштований. 🤖"
    });
  }

  try {
    const dbContext = await getDatabaseContext();
    const prompt = `${SYSTEM_PROMPT}\n\nКОНТЕКСТ З БАЗИ ДАНИХ:\n${dbContext}\n\nКОРИСТУВАЧ ЗАПИТУЄ: ${message}\n\nВідповідай на основі наданого контексту. Якщо даних немає, чесно про це скажи.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ response: responseText });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({
      response: "Сталася помилка при обробці запиту. Спробуйте пізніше. 🔌"
    });
  }
});

// --- API Endpoints ---

// Get all layers/metrics (Public)
app.get("/api/layers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.layers WHERE is_active = true ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Create a new layer (Protected)
app.post("/api/layers", authMiddleware, async (req, res) => {
  const { name, slug, color_theme, suffix } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO public.layers (name, slug, color_theme, suffix) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, slug, color_theme, suffix]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get data for a specific layer (Public) - with Hierarchical Roll-up and Period support
app.get("/api/data/:layer_slug", async (req, res) => {
  const { layer_slug } = req.params;
  const period = req.query.period || null;

  try {
    const query = `
      WITH raion_agg AS (
        SELECT DISTINCT ON (r.parent_region_id, rv.layer_id)
          r.parent_region_id,
          rv.layer_id,
          rv.period,
          SUM(rv.value) OVER (PARTITION BY r.parent_region_id, rv.layer_id, rv.period) as total_value
        FROM raion_values rv
        JOIN raions r ON rv.raion_id = r.id
        WHERE ($2::text IS NULL OR rv.period = $2::date)
        ORDER BY r.parent_region_id, rv.layer_id, rv.period DESC
      ),
      oblast_direct AS (
          SELECT DISTINCT ON (region_id, layer_id)
            region_id,
            layer_id,
            value,
            period
          FROM region_values
          WHERE ($2::text IS NULL OR period = $2::date)
          ORDER BY region_id, layer_id, period DESC
      )
      SELECT 
        reg.name as region,
        COALESCE(NULLIF(agg.total_value, 0), direct.value, 0) as value,
        l.suffix,
        COALESCE(agg.period, direct.period) as period,
        (agg.total_value IS NOT NULL AND agg.total_value > 0) as is_aggregated
      FROM regions reg
      CROSS JOIN layers l
      LEFT JOIN raion_agg agg ON agg.parent_region_id = reg.id AND agg.layer_id = l.id
      LEFT JOIN oblast_direct direct ON direct.region_id = reg.id AND direct.layer_id = l.id
      WHERE l.slug = $1
      ORDER BY reg.name ASC
    `;
    const result = await pool.query(query, [layer_slug, period]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get district-level data for a specific layer (Public) - with Period support
app.get("/api/raion-data/:layer_slug", async (req, res) => {
  const { layer_slug } = req.params;
  const period = req.query.period || null;

  try {
    const query = `
      SELECT DISTINCT ON (r.id)
        r.name as raion,
        reg.name as parent_oblast,
        COALESCE(rv.value, 0) as value,
        l.suffix,
        rv.period
      FROM raions r
      JOIN regions reg ON r.parent_region_id = reg.id
      CROSS JOIN layers l
      LEFT JOIN raion_values rv ON rv.raion_id = r.id AND rv.layer_id = l.id
        AND ($2::text IS NULL OR rv.period = $2::date)
      WHERE l.slug = $1
      ORDER BY r.id, rv.period DESC NULLS LAST
    `;
    const result = await pool.query(query, [layer_slug, period]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get historical values for ALL regions in a layer (Public) - For dashboard sparklines
app.get("/api/layer-history/:layer_slug", async (req, res) => {
  const { layer_slug } = req.params;
  try {
    // This query gets both direct oblast values and aggregated raion sums per period
    const query = `
      WITH all_periods AS (
        SELECT DISTINCT period FROM (
          SELECT period FROM region_values
          UNION
          SELECT period FROM raion_values
        ) p
      ),
      raion_agg AS (
        SELECT 
          r.parent_region_id,
          rv.layer_id,
          rv.period,
          SUM(rv.value) as total_value
        FROM raion_values rv
        JOIN raions r ON rv.raion_id = r.id
        GROUP BY r.parent_region_id, rv.layer_id, rv.period
      ),
      oblast_direct AS (
        SELECT region_id, layer_id, value, period
        FROM region_values
      )
      SELECT 
        reg.name as region,
        COALESCE(NULLIF(agg.total_value, 0), direct.value, 0) as value,
        ap.period
      FROM regions reg
      CROSS JOIN all_periods ap
      JOIN layers l ON l.slug = $1
      LEFT JOIN raion_agg agg ON agg.parent_region_id = reg.id AND agg.layer_id = l.id AND agg.period = ap.period
      LEFT JOIN oblast_direct direct ON direct.region_id = reg.id AND direct.layer_id = l.id AND direct.period = ap.period
      WHERE COALESCE(NULLIF(agg.total_value, 0), direct.value) IS NOT NULL
      ORDER BY reg.name, ap.period ASC
    `;
    const result = await pool.query(query, [layer_slug]);

    const grouped = result.rows.reduce((acc, row) => {
      if (!acc[row.region]) acc[row.region] = [];
      acc[row.region].push({ value: row.value, period: row.period });
      return acc;
    }, {});

    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get history for a specific region (Public)
app.get("/api/history/:layer_slug/:region_name", async (req, res) => {
  const { layer_slug, region_name } = req.params;
  try {
    const query = `
      WITH all_periods AS (
        SELECT DISTINCT period FROM (
          SELECT period FROM region_values rv JOIN layers l ON rv.layer_id = l.id WHERE l.slug = $1
          UNION
          SELECT period FROM raion_values rv JOIN layers l ON rv.layer_id = l.id WHERE l.slug = $1
        ) p
      )
      SELECT 
        ap.period,
        COALESCE(NULLIF(agg.total_value, 0), direct.value, 0) as value
      FROM all_periods ap
      LEFT JOIN (
        SELECT rv.period, rv.value, l.id as layer_id
        FROM region_values rv
        JOIN regions r ON rv.region_id = r.id
        JOIN layers l ON rv.layer_id = l.id
        WHERE l.slug = $1 AND r.name = $2
      ) direct ON ap.period = direct.period
      LEFT JOIN (
        SELECT rv.period, SUM(rv.value) as total_value
        FROM raion_values rv
        JOIN raions ra ON rv.raion_id = ra.id
        JOIN regions reg ON ra.parent_region_id = reg.id
        JOIN layers l ON rv.layer_id = l.id
        WHERE l.slug = $1 AND reg.name = $2
        GROUP BY rv.period
      ) agg ON ap.period = agg.period
      ORDER BY ap.period ASC
    `;
    const result = await pool.query(query, [layer_slug, region_name]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get history for a specific raion (Public)
app.get("/api/raion-history/:layer_slug/:raion_name", async (req, res) => {
  const { layer_slug, raion_name } = req.params;
  try {
    const query = `
      SELECT 
        rv.period, 
        rv.value
      FROM raion_values rv
      JOIN raions r ON rv.raion_id = r.id
      JOIN layers l ON rv.layer_id = l.id
      WHERE l.slug = $1 AND r.name = $2
      ORDER BY rv.period ASC
    `;
    const result = await pool.query(query, [layer_slug, raion_name]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get available periods for a layer (Public)
app.get("/api/periods/:layer_slug", async (req, res) => {
  const { layer_slug } = req.params;
  try {
    const query = `
      SELECT DISTINCT period FROM (
        SELECT rv.period
        FROM region_values rv
        JOIN layers l ON rv.layer_id = l.id
        WHERE l.slug = $1
        UNION
        SELECT rv.period
        FROM raion_values rv
        JOIN layers l ON rv.layer_id = l.id
        WHERE l.slug = $1
      ) p
      ORDER BY period ASC
    `;
    const result = await pool.query(query, [layer_slug]);
    res.json(result.rows.map(r => new Date(r.period).toISOString().split('T')[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Clear history for a layer (Protected)
app.delete("/api/history/:layer_slug", authMiddleware, async (req, res) => {
  const { layer_slug } = req.params;
  const { period } = req.query; // Optional specific date to delete

  try {
    const layerRes = await pool.query("SELECT id FROM layers WHERE slug = $1", [layer_slug]);
    if (layerRes.rows.length === 0) return res.status(404).json({ error: "Layer not found" });
    const layerId = layerRes.rows[0].id;

    let query = "DELETE FROM region_values WHERE layer_id = $1";
    let params = [layerId];

    if (period) {
      query += " AND period = $2";
      params.push(period);
    }

    const result = await pool.query(query, params);

    // Also clear raion history if no specific period or that period
    let raionQuery = "DELETE FROM raion_values WHERE layer_id = $1";
    if (period) raionQuery += " AND period = $2";
    await pool.query(raionQuery, params);

    res.json({ success: true, deleted_count: result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Delete an entire layer (Protected)
app.delete("/api/layers/:layer_slug", authMiddleware, async (req, res) => {
  const { layer_slug } = req.params;
  try {
    const layerRes = await pool.query("SELECT id FROM layers WHERE slug = $1", [layer_slug]);
    if (layerRes.rows.length === 0) return res.status(404).json({ error: "Layer not found" });
    const layerId = layerRes.rows[0].id;

    // First delete all values
    await pool.query("DELETE FROM region_values WHERE layer_id = $1", [layerId]);
    // Then delete the layer
    await pool.query("DELETE FROM layers WHERE id = $1", [layerId]);

    res.json({ success: true, message: "Layer and all associated data deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update data for a specific layer (Protected)
app.post("/api/data", authMiddleware, async (req, res) => {
  const { layer_slug, data, period } = req.body;
  const targetPeriod = period || new Date().toISOString().split('T')[0].substring(0, 7) + "-01";

  try {
    const layerRes = await pool.query("SELECT id FROM layers WHERE slug = $1", [layer_slug]);
    if (layerRes.rows.length === 0) return res.status(404).json({ error: "Layer not found" });
    const layerId = layerRes.rows[0].id;

    for (const item of data) {
      const regionRes = await pool.query("SELECT id FROM regions WHERE name = $1", [item.region_name]);
      if (regionRes.rows.length > 0) {
        const regionId = regionRes.rows[0].id;
        const query = `INSERT INTO region_values (layer_id, region_id, value, period) 
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (layer_id, region_id, period) DO UPDATE SET value = $3`;
        const params = [layerId, regionId, parseInt(item.value, 10), targetPeriod];
        await pool.query(query, params);
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Import from Sheets (Mocked) (Protected)
app.post("/api/import-sheets", authMiddleware, async (req, res) => {
  const { layer_slug, sheet_data } = req.body;
  // Implementation logic skipped for brevity, reusing auth middleware
  res.json({ success: true, message: "Use /api/data for bulk updates" });
});

// Update raion data (Admin only)
app.post("/api/raion-data", authMiddleware, async (req, res) => {
  const { layer_slug, data, period } = req.body;
  const targetPeriod = period || new Date().toISOString().split('T')[0].substring(0, 7) + "-01";
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const layerRes = await client.query("SELECT id FROM layers WHERE slug = $1", [layer_slug]);
    if (layerRes.rows.length === 0) {
      throw new Error("Layer not found");
    }
    const layer_id = layerRes.rows[0].id;

    for (const item of data) {
      const { raion_name, value } = item;

      const raionRes = await client.query("SELECT id FROM raions WHERE name = $1", [raion_name]);
      if (raionRes.rows.length === 0) continue;
      const raion_id = raionRes.rows[0].id;

      await client.query(`
                INSERT INTO raion_values (raion_id, layer_id, value, period)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (raion_id, layer_id, period) 
                DO UPDATE SET value = EXCLUDED.value
            `, [raion_id, layer_id, value, targetPeriod]);
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to update raion data" });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
