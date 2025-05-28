const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "map_data",
  password: "Lambada",
  port: 5432,
});

app.get("/api/regions", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name, total, vacancies, rating, id_1 FROM public.regions"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(3001, () => {
  console.log("Backend server running on http://localhost:3001");
});
