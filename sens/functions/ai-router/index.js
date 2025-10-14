export async function handler(event, context) {
  try {
    const isForm = (event.headers?.["content-type"]||"").includes("application/x-www-form-urlencoded");
    const bodyStr = event.body || "";
    const params = isForm ? Object.fromEntries(new URLSearchParams(bodyStr)) : JSON.parse(bodyStr || "{}");

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