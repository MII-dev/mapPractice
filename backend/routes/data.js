const express = require("express");
const router = express.Router();

module.exports = function createDataRouter(pool, authMiddleware) {
    // Get data for a specific layer (Public) — with Hierarchical Roll-up and Period support
    router.get("/:layer_slug", async (req, res) => {
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

    // Update data for a specific layer (Protected)
    router.post("/", authMiddleware, async (req, res) => {
        const { layer_slug, data, period } = req.body;
        const targetPeriod =
            period || new Date().toISOString().split("T")[0].substring(0, 7) + "-01";

        try {
            const layerRes = await pool.query("SELECT id FROM layers WHERE slug = $1", [layer_slug]);
            if (layerRes.rows.length === 0) return res.status(404).json({ error: "Layer not found" });
            const layerId = layerRes.rows[0].id;

            for (const item of data) {
                const regionRes = await pool.query("SELECT id FROM regions WHERE name = $1", [
                    item.region_name,
                ]);
                if (regionRes.rows.length > 0) {
                    const regionId = regionRes.rows[0].id;
                    const query = `INSERT INTO region_values (layer_id, region_id, value, period) 
                       VALUES ($1, $2, $3, $4)
                       ON CONFLICT (layer_id, region_id, period) DO UPDATE SET value = $3`;
                    await pool.query(query, [layerId, regionId, parseInt(item.value, 10), targetPeriod]);
                }
            }
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Database error" });
        }
    });

    return router;
};
