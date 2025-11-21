export async function handler(event, context) {
  try {
    // 1) Нормализуем заголовки и тип контента
    const headers = event.headers || {};
    const ct =
      (headers["content-type"] ||
       headers["Content-Type"] ||
       headers["CONTENT-TYPE"] ||
       "").toLowerCase();

    // 2) Достаём raw body и декодируем base64 при необходимости
    let rawBody = event.body || "";
    if (event.isBase64Encoded) {
      rawBody = Buffer.from(rawBody, "base64").toString("utf8");
    }

    // 3) Универсальный парсинг: сначала form, потом json, иначе fallback к form
    let params = {};
    if (ct.includes("application/x-www-form-urlencoded")) {
      params = Object.fromEntries(new URLSearchParams(rawBody));
    } else if (ct.includes("application/json")) {
      try {
        params = JSON.parse(rawBody || "{}");
      } catch {
        params = {};
      }
    } else {
      // Часто API GW ставит text/plain; пробуем разобрать как form
      try {
        params = Object.fromEntries(new URLSearchParams(rawBody));
      } catch {
        params = {};
      }
    }

    // --- Дальше логика как была ---
    const num = v => isNaN(+v) ? 0 : +v;
    const bool = v => (v === "1" || v === 1 || v === true || v === "true");

    const lw = num(params.lw_practice);
    const ev = num(params.ev_challenge);
    const slip = num(params.shadow_slip);

    const sync_help     = bool(params.sync_help);
    const ease          = bool(params.ease);
    const magnetism     = bool(params.magnetism);
    const clarity_calm  = bool(params.clarity_calm);
    const energy_up     = bool(params.energy_up);
    const friction_wall = bool(params.friction_wall);
    const noise_over    = bool(params.noise_overload);
    const drain         = bool(params.drain);

    const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
    const intent = 0.6*lw + 0.4*ev - 0.5*slip;
    const intentNorm = clamp(intent/3, 0, 1);

    const raRaw =
      1.2*(sync_help?1:0) + 1.0*(ease?1:0) + 1.0*(magnetism?1:0) +
      0.8*(clarity_calm?1:0) + 0.8*(energy_up?1:0) -
      1.2*(friction_wall?1:0) - 1.0*(noise_over?1:0) - 1.0*(drain?1:0);

    const sigmoid = x => 1/(1+Math.exp(-x));
    const fieldIdx = sigmoid(raRaw/3);

    const base = 120 + 80*intentNorm;
    const field = 60 * (2*fieldIdx - 1);
    const hawkins = clamp(Math.round(base + field), 50, 350);

    let state = "TRANSITION";
    if (intentNorm >= 0.5 && fieldIdx >= 0.5) state = "POWER";
    else if (intentNorm >= 0.5 && fieldIdx < 0.3) state = "FORCE";
    else if (intentNorm < 0.3 && fieldIdx >= 0.6) state = "RANDOM_LUCK";

    const tips = [];
    if (state === "POWER") {
      tips.push("Повтори маленький шаг, сохрани мерность (не увеличивай давление).");
      tips.push("Оставь 10–20% недоделанным — дай полю дозавершить.");
    } else if (state === "FORCE") {
      tips.push("Сделай паузу на день и снизь амплитуду: 1 скромный шаг по Делу Жизни.");
      tips.push("Замени «доказывать» на «попросить/пригласить»; проверь, где включился контроль.");
    } else if (state === "RANDOM_LUCK") {
      tips.push("Зафиксируй благодарность и вернись к ясности шага в Делe Жизни/Эволюции.");
    } else {
      tips.push("Уточни один параметр: что сегодня считается честным шагом? Собери ещё 1–2 дня данных.");
    }

    const badge = (cls, text) => `<span class="badge ${cls}">${text}</span>`;
    const stateBadge =
      state === "POWER" ? badge("power","POWER") :
      state === "FORCE" ? badge("force","FORCE") :
      badge("trans", state);

    const html = `
      <div class="card">
        <div style="display:flex;align-items:center;gap:10px">
          <strong>Ориентир:</strong> ${stateBadge}
          <span class="muted">Хокинс ≈ <b>${hawkins}</b></span>
          <span class="muted">intent ${intentNorm.toFixed(2)} • field ${fieldIdx.toFixed(2)}</span>
        </div>
        <ul style="margin:10px 0 0 18px">
          ${tips.map(t=>`<li>${t}</li>`).join("")}
        </ul>
      </div>
    `;

    return { statusCode: 200, headers: { "content-type":"text/html; charset=utf-8" }, body: html };
  } catch (e) {
    return { statusCode: 500, headers: { "content-type":"text/plain; charset=utf-8" }, body: "Ошибка: "+(e?.message||e) };
  }
}