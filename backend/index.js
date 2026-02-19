const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// ─── App setup ─────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// ─── Database ──────────────────────────────────────────────

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "map_data",
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// ─── Auth middleware ───────────────────────────────────────

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

  const credentials = Buffer.from(token, "base64").toString("utf-8");
  const [, password] = credentials.split(":");

  if (password !== adminPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  next();
};

// ─── Database initialization ───────────────────────────────

async function initDB() {
  try {
    const migrationsDir = path.join(__dirname, "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
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

initDB();

// ─── Routes ────────────────────────────────────────────────

// Verify Admin Credentials
app.get("/api/verify-admin", authMiddleware, (req, res) => {
  res.json({ status: "ok" });
});

// Import Sheets (stub)
app.post("/api/import-sheets", authMiddleware, async (req, res) => {
  res.json({ success: true, message: "Use /api/data for bulk updates" });
});

// Mount route modules
const createLayersRouter = require("./routes/layers");
const createDataRouter = require("./routes/data");
const createHistoryRouter = require("./routes/history");
const createChatRouter = require("./routes/chat");

app.use("/api/layers", createLayersRouter(pool, authMiddleware));
app.use("/api/data", createDataRouter(pool, authMiddleware));
app.use("/api", createHistoryRouter(pool, authMiddleware));
app.use("/api/chat", createChatRouter(pool));

// ─── Start server ──────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
