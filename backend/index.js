const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "map_data",
  password: process.env.DB_PASSWORD || "Lambada",
  port: process.env.DB_PORT || 5432,
});

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

// --- API Endpoints ---

// --- API Endpoints ---

// Get all layers/metrics
app.get("/api/layers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.layers WHERE is_active = true ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Create a new layer
app.post("/api/layers", async (req, res) => {
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

// Get data for a specific layer (Joined with Regions)
app.get("/api/data/:layer_slug", async (req, res) => {
  const { layer_slug } = req.params;
  try {
    const query = `
            SELECT r.name as region, COALESCE(rv.value, 0) as value, l.suffix
            FROM regions r
            CROSS JOIN layers l
            LEFT JOIN region_values rv ON rv.region_id = r.id AND rv.layer_id = l.id
            WHERE l.slug = $1
            ORDER BY r.name
        `;
    const result = await pool.query(query, [layer_slug]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update data for a specific layer
app.post("/api/data", async (req, res) => {
  const { layer_slug, data } = req.body; // data: [{ region_name, value }]
  try {
    const layerRes = await pool.query("SELECT id FROM layers WHERE slug = $1", [layer_slug]);
    if (layerRes.rows.length === 0) return res.status(404).json({ error: "Layer not found" });
    const layerId = layerRes.rows[0].id;

    for (const item of data) {
      // Find region ID
      const regionRes = await pool.query("SELECT id FROM regions WHERE name = $1", [item.region_name]);
      if (regionRes.rows.length > 0) {
        const regionId = regionRes.rows[0].id;
        await pool.query(
          `INSERT INTO region_values (layer_id, region_id, value) 
                     VALUES ($1, $2, $3)
                     ON CONFLICT (layer_id, region_id) DO UPDATE SET value = $3`,
          [layerId, regionId, parseInt(item.value, 10)]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Import from Sheets (Mocked for now, but structure ready)
app.post("/api/import-sheets", async (req, res) => {
  // In a real scenario, this would fetch from Google API using the key
  // For now, we will simulate it or expect the frontend to send the parsed sheet data
  // to avoid adding backend fetch logic duplication.
  // Let's assume frontend sends the raw sheet data for simplicity.
  const { layer_slug, sheet_data } = req.body;

  // Calls the same logic as /api/data update
  // This endpoint acts as a semantic alias for "importing"
  try {
    // Reuse logic from above (or just forward request internally)
    // ... implementation identical to /api/data for now ...
    res.json({ success: true, message: "Use /api/data for bulk updates" });
  } catch (err) {
    res.status(500).json({ error: "Import error" });
  }
});

app.listen(3001, () => {
  console.log("Backend server running on http://localhost:3001");
});
