const express = require("express");
const router = express.Router();

module.exports = function createHistoryRouter(pool, authMiddleware) {
    // Get district-level data for a specific layer (Public) — with Period support
    router.get("/raion-data/:layer_slug", async (req, res) => {
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

    // Update raion data (Admin only)
    router.post("/raion-data", authMiddleware, async (req, res) => {
        const { layer_slug, data, period } = req.body;
        const targetPeriod =
            period || new Date().toISOString().split("T")[0].substring(0, 7) + "-01";
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const layerRes = await client.query("SELECT id FROM layers WHERE slug = $1", [layer_slug]);
            if (layerRes.rows.length === 0) throw new Error("Layer not found");
            const layer_id = layerRes.rows[0].id;

            for (const item of data) {
                const { raion_name, value } = item;
                const raionRes = await client.query("SELECT id FROM raions WHERE name = $1", [raion_name]);
                if (raionRes.rows.length === 0) continue;
                const raion_id = raionRes.rows[0].id;

                await client.query(
                    `INSERT INTO raion_values (raion_id, layer_id, value, period)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (raion_id, layer_id, period) 
           DO UPDATE SET value = EXCLUDED.value`,
                    [raion_id, layer_id, value, targetPeriod]
                );
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

    // Get historical values for ALL regions in a layer (Public) — For dashboard sparklines
    router.get("/layer-history/:layer_slug", async (req, res) => {
        const { layer_slug } = req.params;
        try {
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
    router.get("/history/:layer_slug/:region_name", async (req, res) => {
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
    router.get("/raion-history/:layer_slug/:raion_name", async (req, res) => {
        const { layer_slug, raion_name } = req.params;
        try {
            const query = `
        SELECT rv.period, rv.value
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
    router.get("/periods/:layer_slug", async (req, res) => {
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
            res.json(result.rows.map((r) => new Date(r.period).toISOString().split("T")[0]));
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Database error" });
        }
    });

    // Clear history for a layer (Protected)
    router.delete("/history/:layer_slug", authMiddleware, async (req, res) => {
        const { layer_slug } = req.params;
        const { period } = req.query;

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

            // Also clear raion history
            let raionQuery = "DELETE FROM raion_values WHERE layer_id = $1";
            if (period) raionQuery += " AND period = $2";
            await pool.query(raionQuery, params);

            res.json({ success: true, deleted_count: result.rowCount });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Database error" });
        }
    });

    return router;
};
