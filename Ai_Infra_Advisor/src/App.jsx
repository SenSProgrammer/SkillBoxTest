import React, { useMemo, useState, useEffect } from "react";

/* ---------- Вспомогательный экран ошибок ---------- */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("[ErrorBoundary] error:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24 }}>
          <h2 style={{ color: "#b91c1c" }}>Ошибка в компоненте</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.error && this.state.error.message || this.state.error)}</pre>
          <p>Посмотрите консоль DevTools — там стек вызовов укажет точную строку.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- Данные ---------- */
const TASKS = [
  { id: "llm-infer", name: "LLM — инференс", unitHint: "токенов/с и мс", 
    defaultStart: { tps: 50, batch: 8 },
    defaultEnd: { tps: 2000, batch: 128 },
    scaler: (load) => Number(load?.tps) || 0,
  },
  { id: "llm-train", name: "LLM — обучение", unitHint: "токены/с",
    defaultStart: { toksPerSec: 5e4, gbs: 512, seqlen: 4096 },
    defaultEnd: { toksPerSec: 2e6, gbs: 4096, seqlen: 8192 },
    scaler: (load) => Number(load?.toksPerSec) || 0,
  },
  { id: "embeddings", name: "Эмбеддинги", unitHint: "запросов/с",
    defaultStart: { qps: 100, batch: 32, maxToks: 1024 },
    defaultEnd: { qps: 5000, batch: 256, maxToks: 4096 },
    scaler: (load) => Number(load?.qps) || 0,
  },
  { id: "diffusion", name: "Диффузия", unitHint: "изображений/с",
    defaultStart: { ips: 0.5, res: 512, steps: 30 },
    defaultEnd: { ips: 20, res: 1024, steps: 50 },
    scaler: (load) => {
      const ips = Number(load?.ips) || 0;
      const res = Number(load?.res) || 512;
      const steps = Number(load?.steps) || 30;
      return ips * (res / 512) ** 2 * (steps / 30);
    },
  },
  { id: "asr", name: "ASR", unitHint: "запросов/с",
    defaultStart: { qps: 20, rtf: 0.5, wer: 0.12 },
    defaultEnd: { qps: 1000, rtf: 0.3, wer: 0.09 },
    scaler: (load) => {
      const q = Number(load?.qps) || 0;
      const r = Number(load?.rtf) || 1;
      return q / Math.max(0.1, r);
    },
  },
  { id: "vector", name: "Векторный поиск", unitHint: "запросов/с",
    defaultStart: { qps: 200, dims: 768, n: 5e7, recall: 0.9 },
    defaultEnd: { qps: 5000, dims: 1536, n: 5e8, recall: 0.95 },
    scaler: (load) => {
      const qps = Number(load?.qps) || 0;
      const n = Number(load?.n) || 0;
      const dims = Number(load?.dims) || 768;
      return qps * Math.log10(n + 1) * (dims / 768);
    },
  },
];

const HW_PROFILES = [
  { id: "dgx-b200", vendor: "NVIDIA", name: "DGX B200 (8x Blackwell)", memoryTB: 1.44, throughputRU: { base: 1000 }, notes: "NVLink", parts: ["DGX B200"] },
  { id: "gb200-nvl72", vendor: "NVIDIA", name: "GB200 NVL72", memoryTB: 30, throughputRU: { base: 12000 }, notes: "NVLink 5; IB 400–800G", parts: ["GB200 NVL72"] },
  { id: "h200-hgx8", vendor: "NVIDIA", name: "HGX H200 8x", memoryTB: 1.128, throughputRU: { base: 550 }, notes: "141GB HBM3e/GPU", parts: ["935-24287-2740-000"] },
  { id: "h100-hgx8", vendor: "NVIDIA", name: "HGX H100 8x", memoryTB: 0.64, throughputRU: { base: 350 }, notes: "H100 SXM5", parts: ["935-24287-0301-000"] },
  { id: "amd-mi325x-8x", vendor: "AMD", name: "OAM 8x MI325X", memoryTB: 2.048, throughputRU: { base: 650 }, notes: "256GB HBM3e/GPU", parts: ["MI325X OAM"] },
  { id: "gaudi3-8x", vendor: "Intel", name: "Gaudi 3 (HLB-325) 8x", memoryTB: 1.024, throughputRU: { base: 300 }, notes: "all-to-all 4.2 TB/s", parts: ["HLB-325", "HL-325L OAM"] },
  { id: "cpu-epyc-2s", vendor: "AMD", name: "2x EPYC 9754 + PCIe", memoryTB: 0.512, throughputRU: { base: 80 }, notes: "128C, DDR5", parts: ["EPYC 9754"] },
  { id: "cpu-xeon6-2s", vendor: "Intel", name: "2x Xeon 6 + PCIe", memoryTB: 0.512, throughputRU: { base: 70 }, notes: "DDR5, CXL 2.0", parts: ["Xeon 6"] },
];

/* ---------- Утилиты с защитой от NaN/undefined ---------- */
function estimateRequirementRU(taskId, startLoad, endLoad) {
  const task = TASKS.find((t) => t.id === taskId) || TASKS[0];
  const s = Number(task.scaler(startLoad)) || 0;
  const e = Number(task.scaler(endLoad)) || 0;
  const normMap = { "llm-infer": 1, "llm-train": 0.00005, embeddings: 0.5, diffusion: 5, asr: 1, vector: 0.05 };
  const norm = normMap[taskId] ?? 1;
  return { startRU: s * norm, endRU: e * norm };
}

function recommendProfile(reqRU) {
  const sorted = [...HW_PROFILES].sort((a, b) => a.throughputRU.base - b.throughputRU.base);
  let chosen = sorted[0];
  for (const p of sorted) { if (p.throughputRU.base >= reqRU) { chosen = p; break; } chosen = p; }
  return chosen || HW_PROFILES[0];
}

function scalePlan(profile, startRU, endRU) {
  const perNode = Number(profile?.throughputRU?.base) || 1;
  const startNodes = Math.max(1, Math.ceil((Number(startRU) || 0) / perNode));
  const endNodes = Math.max(startNodes, Math.ceil((Number(endRU) || 0) / perNode));
  const interconnect =
    profile?.vendor === "NVIDIA" ? "NVLink/NVSwitch; IB 400–800G" :
    profile?.vendor === "AMD"    ? "IFL; 400G Ethernet/IB" :
    profile?.vendor === "Intel"  ? "HLB-325; 400G Ethernet/IB" : "400G Ethernet/IB";
  return {
    startNodes, endNodes, interconnect,
    notes: profile?.notes || "",
    text: `Старт: ${startNodes} узел(а); Цель: ${endNodes} узел(а). Горизонтальное масштабирование + модельный параллелизм при необходимости. Межсоединение: ${interconnect}.`,
  };
}

function NumberField({ label, value, onChange, step = 1 }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-500">{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="rounded-xl border px-3 py-2 shadow-inner outline-none focus:ring"
      />
    </label>
  );
}

/* ---------- Основной компонент ---------- */
export default function App() {
  console.log("[App] render start");
  const [taskId, setTaskId] = useState(TASKS[0].id);
  const task = useMemo(() => TASKS.find((t) => t.id === taskId) || TASKS[0], [taskId]);

  const [start, setStart] = useState(task.defaultStart);
  const [end, setEnd] = useState(task.defaultEnd);

  useEffect(() => {
    const t = TASKS.find((x) => x.id === taskId) || TASKS[0];
    setStart(t.defaultStart);
    setEnd(t.defaultEnd);
  }, [taskId]);

  const { startRU, endRU } = useMemo(() => estimateRequirementRU(taskId, start, end), [taskId, start, end]);
  const startProfile = useMemo(() => recommendProfile(startRU), [startRU]);
  const endProfile   = useMemo(() => recommendProfile(endRU),   [endRU]);
  const plan = useMemo(() => scalePlan(endProfile, startRU, endRU), [endProfile, startRU, endRU]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">AI Infra Advisor</h1>
            <p className="text-zinc-500">Выберите тип задачи и диапазон нагрузки — получите рекомендацию.</p>
          </header>

          <section className="grid md:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-500">Тип задачи</span>
                <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="rounded-xl border px-3 py-2">
                  {TASKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>

              <div className="rounded-2xl border p-4 bg-white shadow-sm">
                <h2 className="font-medium mb-2">Стартовая нагрузка <span className="text-zinc-400">({task.unitHint})</span></h2>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(start || {}).map(([k, v]) => (
                    <NumberField key={k} label={k} value={Number(v)} onChange={(nv) => setStart((s) => ({ ...(s || {}), [k]: nv }))} step={k==="ips"||k==="rtf"?0.01:1} />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border p-4 bg-white shadow-sm">
                <h2 className="font-medium mb-2">Целевая нагрузка <span className="text-zinc-400">({task.unitHint})</span></h2>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(end || {}).map(([k, v]) => (
                    <NumberField key={k} label={k} value={Number(v)} onChange={(nv) => setEnd((s) => ({ ...(s || {}), [k]: nv }))} step={k==="ips"||k==="rtf"?0.01:1} />
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-4">
              <div className="rounded-2xl border p-4 bg-white shadow-sm">
                <h2 className="font-medium mb-2">Рекомендуемая архитектура</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border p-3">
                    <h3 className="text-sm text-zinc-500">На старт</h3>
                    <div className="text-lg font-semibold">{startProfile.vendor} — {startProfile.name}</div>
                    <div className="text-sm text-zinc-500">Память ≈ {startProfile.memoryTB} TB</div>
                    <div className="text-sm text-zinc-500">Производительность: {startProfile.throughputRU.base} RU</div>
                    <div className="text-xs text-zinc-400">Партнамберы: {startProfile.parts.join(", ")}</div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <h3 className="text-sm text-zinc-500">На цель</h3>
                    <div className="text-lg font-semibold">{endProfile.vendor} — {endProfile.name}</div>
                    <div className="text-sm text-zinc-500">Память ≈ {endProfile.memoryTB} TB</div>
                    <div className="text-sm text-zinc-500">Производительность: {endProfile.throughputRU.base} RU</div>
                    <div className="text-xs text-zinc-400">Партнамберы: {endProfile.parts.join(", ")}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-4 bg-white shadow-sm">
                <h2 className="font-medium mb-2">План масштабирования</h2>
                <p className="text-sm mb-2">{plan.text}</p>
                <p className="text-xs text-zinc-500">Примечания: {plan.notes || "—"}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ErrorBoundary>
  );
}