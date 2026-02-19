const express = require("express");
const router = express.Router();

module.exports = function createLayersRouter(pool, authMiddleware) {
    // Get all layers/metrics (Public)
    router.get("/", async (req, res) => {
        try {
            const result = await pool.query(
                "SELECT * FROM public.layers WHERE is_active = true ORDER BY id ASC"
            );
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Database error" });
        }
    });

    // Create a new layer (Protected)
    router.post("/", authMiddleware, async (req, res) => {
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

    // Delete an entire layer (Protected)
    router.delete("/:layer_slug", authMiddleware, async (req, res) => {
        const { layer_slug } = req.params;
        try {
            const layerRes = await pool.query("SELECT id FROM layers WHERE slug = $1", [layer_slug]);
            if (layerRes.rows.length === 0) return res.status(404).json({ error: "Layer not found" });
            const layerId = layerRes.rows[0].id;

            await pool.query("DELETE FROM region_values WHERE layer_id = $1", [layerId]);
            await pool.query("DELETE FROM layers WHERE id = $1", [layerId]);

            res.json({ success: true, message: "Layer and all associated data deleted successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Database error" });
        }
    });

    return router;
};
