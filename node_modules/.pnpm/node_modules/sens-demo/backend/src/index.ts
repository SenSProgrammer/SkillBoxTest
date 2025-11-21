import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/interpret", async (req, res) => {
  try {
    const { sensid, hex1, hex2, question } = req.body || {};
    if (!sensid || !hex1 || !hex2) {
      return res.status(400).json({ error: "sensid, hex1, hex2 required" });
    }

    // проверка подписки через Auth
    const r = await fetch(`http://localhost:4000/subscription/check/${sensid}`);
    const sub = await r.json();

    const base = [
      `Вопрос: ${question || "К чему готовиться в текущем лунном цикле?"}`,
      `Гексаграммы: ${hex1} → ${hex2}.`,
      `Комментарий: сфокусируйтесь на дисциплине и мягком переходе; уточните намерение.`,
    ].join("\n");

    const premium =
      sub.active && sub.level >= 1
        ? "\nСовет+: распланируйте 2–3 конкретных шага на 7 дней, зафиксируйте их в календаре."
        : "";

    return res.json({ text: base + premium, level: sub.level || 0 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "interpret_failed" });
  }
});

app.listen(8787, () => {
  console.log("✅ Interpret backend running at http://localhost:8787");
});
