const express = require("express");
const router = express.Router();

module.exports = function createChatRouter(pool) {
    // --- AI Assistant Bridge (Gemini) ---
    const { GoogleGenerativeAI } = require("@google/generative-ai");

    const genAI = process.env.GEMINI_API_KEY
        ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        : null;
    const model = genAI
        ? genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })
        : null;

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

    // Helper to build context from DB
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
            statsRes.rows.forEach((row) => {
                const period = new Date(row.period).toISOString().split("T")[0];
                contextText += `- ${row.metric} у регіоні "${row.region}": ${row.value} ${row.suffix} (станом на ${period}).\n`;
            });

            return contextText;
        } catch (err) {
            console.error("Context fetch error:", err);
            return "Дані з бази тимчасово недоступні.";
        }
    }

    // POST /api/chat — Bridge to Gemini with Context
    router.post("/", async (req, res) => {
        const { message } = req.body;
        console.log(`[AI Request]: ${message}`);

        if (!model) {
            return res.json({
                response: "Я Aura! Вибачте, але менй API Key ще не налаштований. 🤖",
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
                response: "Сталася помилка при обробці запиту. Спробуйте пізніше. 🔌",
            });
        }
    });

    return router;
};
