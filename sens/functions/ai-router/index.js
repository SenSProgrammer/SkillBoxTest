export async function handler(event, context) {
  try {
    const headers = event.headers || {};
    const ct =
      (headers["content-type"] ||
       headers["Content-Type"] ||
       headers["CONTENT-TYPE"] ||
       "").toLowerCase();

    let rawBody = event.body || "";
    if (event.isBase64Encoded) {
      rawBody = Buffer.from(rawBody, "base64").toString("utf8");
    }

    let params = {};
    if (ct.includes("application/x-www-form-urlencoded")) {
      params = Object.fromEntries(new URLSearchParams(rawBody));
    } else if (ct.includes("application/json")) {
      try { params = JSON.parse(rawBody || "{}"); } catch { params = {}; }
    } else {
      try { params = Object.fromEntries(new URLSearchParams(rawBody)); } catch { params = {}; }
    }

    if (params.bonus === "poem") {
      const lw = params.lw_key || "—";
      const ev = params.ev_key || "—";
      const ra = params.ra_key || "—";
      const pu = params.pu_key || "—";

      const poem = [
        `Ключи мои: LW ${lw} • EV ${ev} • RA ${ra} • PU ${pu},`,
        `В шаге смелом — тишина, а в тишине — ответ.`,
        `Дарю, не требуя, и мир шепнёт: «иду»,`,
        `Лидерствуя смиренно, превращаю тьму в свет.`
      ].join("<br>");

      const html = `
        <div class="card">
          <div class="muted" style="margin-bottom:6px">Бонус-четверостишие (черновик)</div>
          <div>${poem}</div>
          <div class="note" style="margin-top:8px">Здесь позже будет вызов YaGPT/OpenAI с вашим user_id.</div>
        </div>
      `;
      return { statusCode:200, headers:{ "content-type":"text/html; charset=utf-8" }, body: html };
    }

    return { statusCode: 400, headers:{ "content-type":"text/plain; charset=utf-8" }, body: "unknown action" };
  } catch (e) {
    return { statusCode: 500, headers:{ "content-type":"text/plain; charset=utf-8" }, body: "Ошибка: "+(e?.message||e) };
  }
}