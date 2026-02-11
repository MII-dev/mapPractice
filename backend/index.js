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
    const sql = fs.readFileSync(path.join(__dirname, "migrations", "001_init.sql"), "utf8");
    await pool.query(sql);
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
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;

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

// POST /api/chat - Bridge to Gemini
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  console.log(`[AI Request]: ${message}`);

  if (!model) {
    return res.json({
      response: "Я Aura! Вибачте, але мій 'мозок' (API Key) ще не налаштований. Будь ласка, додайте GEMINI_API_KEY в налаштування сервера. 🤖"
    });
  }

  try {
    const prompt = `${SYSTEM_PROMPT}\n\nКористувач запитує: ${message}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ response: responseText });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({
      response: "Ой, щось пішло не так при спілкуванні з моїм ШІ-ядром. Спробуйте пізніше! 🔌"
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

// Get data for a specific layer (Public)
app.get("/api/data/:layer_slug", async (req, res) => {
  const { layer_slug } = req.params;
  try {
    const query = `
            SELECT DISTINCT ON (r.name) 
                r.name as region, 
                COALESCE(rv.value, 0) as value, 
                l.suffix
            FROM regions r
            CROSS JOIN layers l
            LEFT JOIN region_values rv ON rv.region_id = r.id AND rv.layer_id = l.id
            WHERE l.slug = $1
            ORDER BY r.name, rv.period DESC NULLS LAST
        `;
    const result = await pool.query(query, [layer_slug]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get historical values for a region (Public)
app.get("/api/history/:layer_slug/:region_name", async (req, res) => {
  const { layer_slug, region_name } = req.params;
  try {
    const query = `
            SELECT rv.value, rv.period
            FROM region_values rv
            JOIN layers l ON rv.layer_id = l.id
            JOIN regions r ON rv.region_id = r.id
            WHERE l.slug = $1 AND r.name = $2
            ORDER BY rv.period ASC
        `;
    const result = await pool.query(query, [layer_slug, region_name]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update data for a specific layer (Protected)
app.post("/api/data", authMiddleware, async (req, res) => {
  const { layer_slug, data, period } = req.body; // data: [{ region_name, value }], period: 'YYYY-MM-DD' (optional)
  const targetPeriod = period || new Date().toISOString().split('T')[0];

  try {
    const layerRes = await pool.query("SELECT id FROM layers WHERE slug = $1", [layer_slug]);
    if (layerRes.rows.length === 0) return res.status(404).json({ error: "Layer not found" });
    const layerId = layerRes.rows[0].id;

    for (const item of data) {
      // Find region ID
      const regionRes = await pool.query("SELECT id FROM regions WHERE name = $1", [item.region_name]);
      if (regionRes.rows.length > 0) {
        const regionId = regionRes.rows[0].id;
        const query = `INSERT INTO region_values (layer_id, region_id, value, period) 
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (layer_id, region_id, period) DO UPDATE SET value = $3`;
        const params = [layerId, regionId, parseInt(item.value, 10), targetPeriod];
        console.log("Executing query:", query, params);
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
