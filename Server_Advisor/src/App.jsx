import React, { useEffect, useMemo, useState } from "react";

/**
 * Corp Server Advisor (SPA, без авторизации)
 * Задачи: виртуализация/консолидация (SAN), HCI (hybrid/all-flash), выделенные СУБД/OLAP/ERP,
 * изолированные сервисы (AD, PKI, VPN и т.д.), Edge/ROBO. Гибридные облака подразумеваются.
 * 
 * Пользователь выбирает: тип задачи → стартовую и целевую нагрузку в профильных метриках →
 * получает 3 варианта конфига (Cost-Optimized / Balanced / Performance), стартовую и целевую
 * архитектуру, а также план масштабирования (горизонтальный кластер/внутренний апгрейд).
 * 
 * Все цифры — инженерные ориентиры для sizing-дискуссий. Перед закупкой — валидировать нагрузкой.
 */

/* ---------------- Классификация задач ---------------- */
const TASKS = [
  {
    id: "virt-san",
    name: "Виртуализация/консолидация + SAN",
    metricsHint: "VMs / vCPU / vRAM / IOPS / latency",
    defaultStart: { vms: 60, vcpu: 240, vram: 512, iops: 50000, lat_ms: 2 },
    defaultEnd:   { vms: 300, vcpu: 1200, vram: 2048, iops: 300000, lat_ms: 2 },
    scaler: (m) => (m.vcpu || 0) + (m.vram || 0) / 2 + (m.iops || 0) / 2000, // простая агрегирующая метрика
    notes: "Классика: 2S серверы, FC/iSCSI к SAN, vSphere/Hyper-V/KVM."
  },
  {
    id: "hci-hybrid",
    name: "HCI — гибрид (HDD+SSD/Cache)",
    metricsHint: "IOPS / Throughput GB/s / Capacity TB / latency",
    defaultStart: { iops: 80000, th_gbs: 3, cap_tb: 100, lat_ms: 3 },
    defaultEnd:   { iops: 500000, th_gbs: 10, cap_tb: 800, lat_ms: 3 },
    scaler: (m) => (m.iops || 0) / 1000 + (m.th_gbs || 0) * 5 + (m.cap_tb || 0) / 20,
    notes: "vSAN/Ceph/Nutanix: 3–8 узлов старт, 10–32 масштабирование."
  },
  {
    id: "hci-af",
    name: "HCI — All‑Flash NVMe",
    metricsHint: "IOPS / Throughput GB/s / Capacity TB / latency",
    defaultStart: { iops: 300000, th_gbs: 10, cap_tb: 100, lat_ms: 1 },
    defaultEnd:   { iops: 2000000, th_gbs: 40, cap_tb: 1000, lat_ms: 1 },
    scaler: (m) => (m.iops || 0) / 1000 + (m.th_gbs || 0) * 10 + (m.cap_tb || 0) / 10,
    notes: "NVMe only; <1ms p99; 4–64 узлов."
  },
  {
    id: "db-oltp",
    name: "Выделенная СУБД (OLTP)",
    metricsHint: "TPS / p99 ms / RAM GB / IOPS",
    defaultStart: { tps: 50000, p99_ms: 10, ram: 512, iops: 500000 },
    defaultEnd:   { tps: 500000, p99_ms: 5,  ram: 2048, iops: 2000000 },
    scaler: (m) => (m.tps || 0) / 1000 + (m.ram || 0) / 8 + (m.iops || 0) / 10000,
    notes: "1–2 узла (Active/Standby) или кластер; NVMe RAID10, высокая частота CPU."
  },
  {
    id: "olap-dwh",
    name: "OLAP / DWH / MPP",
    metricsHint: "Scan GB/s / RAM TB / Concurrency",
    defaultStart: { scan_gbs: 5, ram_gb: 1024, conc: 10 },
    defaultEnd:   { scan_gbs: 40, ram_gb: 4096, conc: 50 },
    scaler: (m) => (m.scan_gbs || 0) * 20 + (m.ram_gb || 0) / 16 + (m.conc || 0) * 5,
    notes: "3–32 узлов MPP; упор на полосу NVMe и память."
  },
  {
    id: "erp-app",
    name: "ERP/App‑серверы",
    metricsHint: "Users / RPS / RAM",
    defaultStart: { users: 2000, rps: 500, ram: 128 },
    defaultEnd:   { users: 20000, rps: 5000, ram: 512 },
    scaler: (m) => (m.users || 0) / 200 + (m.rps || 0) / 50 + (m.ram || 0) / 4,
    notes: "2–8 узлов фронта (N+1); балансировщики; кэш."
  },
  {
    id: "isolated",
    name: "Изолированные сервисы (AD/PKI/VPN)",
    metricsHint: "CPU % / RAM / NICs / Crypto",
    defaultStart: { cpu: 4, ram: 32, nics: 2, crypto: 1 },
    defaultEnd:   { cpu: 16, ram: 128, nics: 4, crypto: 2 },
    scaler: (m) => (m.cpu || 0) * 5 + (m.ram || 0) / 2 + (m.nics || 0) * 10,
    notes: "Требования малы; важнее изоляция, HSM/TPM, 2×NIC."
  },
  {
    id: "edge-robo",
    name: "Edge / ROBO",
    metricsHint: "VMs / IOPS / Storage TB",
    defaultStart: { vms: 10, iops: 10000, cap_tb: 10 },
    defaultEnd:   { vms: 50, iops: 60000, cap_tb: 80 },
    scaler: (m) => (m.vms || 0) * 5 + (m.iops || 0) / 2000 + (m.cap_tb || 0) / 2,
    notes: "2–3 узла, без внешнего SAN, локальная выживаемость."
  },
];

/* ---------------- Аппаратные профили (совр. 5–6 поколение CPU) ---------------- */
// Указаны ориентиры по ядрам/памяти/шинам для выбора базового класса узла.
const HW_PROFILES = [
  {
    id: "2s-density",
    name: "2S Density (Xeon 6 / EPYC 9005)",
    cpu: "2× 48–128C (современные P/E‑cores или Zen4c/5)",
    ram: "256 GB – 2 TB DDR5 (8–12 каналов/CPU)",
    pcie: "PCIe 5.0 (80–128 лейн/CPU), CXL 2.0",
    storage: "Boot mirror + NVMe (4–12) или HBA/FC",
    network: "2×25/100/200G; опц. 32/64G FC",
    score: 100
  },
  {
    id: "2s-nvme-heavy",
    name: "2S NVMe‑Heavy",
    cpu: "2× 64–128C high‑freq/throughput",
    ram: "512 GB – 3 TB DDR5",
    pcie: "PCIe 5.0/6.0 ready; CXL",
    storage: "NVMe 8–24 (U.2/U.3/EDSFF)",
    network: "2×100–400G; опц. FC",
    score: 160
  },
  {
    id: "1s-compact",
    name: "1S Compact",
    cpu: "1× 16–64C",
    ram: "32 – 256 GB",
    pcie: "PCIe 5.0",
    storage: "2–4× NVMe/SATA",
    network: "2×10/25G",
    score: 40
  },
  {
    id: "4s-scaleup",
    name: "4S Scale‑Up (RAM/IO)",
    cpu: "4× 48–96C",
    ram: "1 – 8 TB DDR5",
    pcie: "PCIe 5.0, CXL мем. расширение",
    storage: "NVMe 16–32 + внешние JBOD",
    network: "4×100–400G; FC",
    score: 260
  }
];

/* ---------------- Подбор профиля и генерация конфигов ---------------- */
function aggregateScore(taskId, load) {
  const t = TASKS.find(x => x.id === taskId);
  return t ? t.scaler(load) : 0;
}

function pickProfile(score) {
  // Грубое сопоставление «очки → класс узла»
  const sorted = [...HW_PROFILES].sort((a,b)=>a.score-b.score);
  let chosen = sorted[0];
  for (const p of sorted) { if (p.score >= score) { chosen = p; break; } chosen = p; }
  return chosen;
}

function proposeConfigs(taskId, startLoad, endLoad) {
  const sScore = aggregateScore(taskId, startLoad);
  const eScore = aggregateScore(taskId, endLoad);
  const baseStart = pickProfile(sScore);
  const baseEnd   = pickProfile(eScore);

  // Эвристики по типу задачи → диски/сеть/FC и т.п.
  const task = TASKS.find(t=>t.id===taskId);
  const isVirt = taskId === "virt-san";
  const isHci  = taskId === "hci-hybrid" || taskId === "hci-af";
  const isDb   = taskId === "db-oltp";
  const isOlap = taskId === "olap-dwh";
  const isIso  = taskId === "isolated" || taskId === "edge-robo";

  function mkNodeVariant(base, tier) {
    const coef = tier === "cost" ? 0.8 : tier === "perf" ? 1.4 : 1.0;
    const cpuCores = tier === "perf" ? "2× 96–128C" : tier === "cost" ? "2× 32–64C" : "2× 64–96C";
    const ramGB = tier === "perf" ? 2048 : tier === "cost" ? 512 : 1024;
    const nvmeCount = isDb || isOlap || taskId === "hci-af" ? (tier === "perf" ? 24 : tier === "cost" ? 8 : 16) : (isIso ? 2 : 6);
    const hddCount = taskId === "hci-hybrid" ? (tier === "perf" ? 12 : tier === "cost" ? 6 : 8) : 0;
    const net = isHci || isOlap || isDb ? (tier === "perf" ? "2×200/400G" : tier === "cost" ? "2×25/50G" : "2×100/200G") : "2×10/25G";
    const fc  = isVirt ? (tier === "cost" ? "2×32G FC" : "2×32/64G FC") : "—";

    return {
      tier,
      nodeClass: base.name,
      cpu: cpuCores,
      ram: `${ramGB} GB DDR5`,
      storage: hddCount>0 ? `${hddCount}×HDD + ${Math.max(2, Math.round(nvmeCount/4))}×SSD Cache + ${nvmeCount}×NVMe` : `${nvmeCount}×NVMe`,
      network: net,
      san_fc: fc,
    };
  }

  const start = [mkNodeVariant(baseStart, "cost"), mkNodeVariant(baseStart, "balanced"), mkNodeVariant(baseStart, "perf")];
  const end   = [mkNodeVariant(baseEnd,   "cost"), mkNodeVariant(baseEnd,   "balanced"), mkNodeVariant(baseEnd,   "perf")];

  // План масштабирования
  const startNodes = Math.max(1, Math.ceil(sScore / 100));
  const endNodes   = Math.max(startNodes, Math.ceil(eScore / 100));
  const scale = isVirt ? "Горизонтально: добавление узлов к кластеру виртуализации; хранение в SAN."
            : isHci  ? "Линейно: добавление HCI-узлов, ребаланс данных; контролировать RF/EC."
            : isDb   ? "Вертикально (частота/ядра, RAM, NVMe) + кластер/репликация (AlwaysOn/Pacemaker)."
            : isOlap ? "MPP‑кластеризация: шардинг по данным, рост throughput пропорц. узлам."
            : isIso  ? "Обычно вертикально (RAM/NVMe) или дублирование instance для отказоустойчивости."
            : "Добавление узлов и/или апгрейды в пределах шасси.";

  return { baseStart, baseEnd, start, end, startNodes, endNodes, scale };
}

/* ---------------- UI ---------------- */
function NumberField({ label, value, onChange, step=1 }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-500">{label}</span>
      <input type="number" step={step} value={Number.isFinite(value) ? value : 0}
             onChange={(e)=>onChange(parseFloat(e.target.value)||0)}
             className="rounded-xl border px-3 py-2 shadow-inner outline-none focus:ring"/>
    </label>
  );
}

export default function App() {
  const [taskId, setTaskId] = useState(TASKS[0].id);
  const task = useMemo(()=>TASKS.find(t=>t.id===taskId)||TASKS[0],[taskId]);

  const [start, setStart] = useState(task.defaultStart);
  const [end, setEnd]     = useState(task.defaultEnd);
  useEffect(()=>{ const t = TASKS.find(x=>x.id===taskId)||TASKS[0]; setStart(t.defaultStart); setEnd(t.defaultEnd); },[taskId]);

  const plan = useMemo(()=>proposeConfigs(taskId, start, end), [taskId, start, end]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Corp Server Advisor</h1>
          <p className="text-zinc-500">Подбор серверной архитектуры: виртуализация/SAN, HCI, СУБД/OLAP/ERP, изолированные сервисы, Edge.</p>
        </header>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-500">Тип задачи</span>
              <select value={taskId} onChange={(e)=>setTaskId(e.target.value)} className="rounded-xl border px-3 py-2">
                {TASKS.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>

            <div className="rounded-2xl border p-4 bg-white shadow-sm">
              <h2 className="font-medium mb-2">Стартовая нагрузка <span className="text-zinc-400">({task.metricsHint})</span></h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(start).map(([k,v])=> (
                  <NumberField key={k} label={k} value={Number(v)} onChange={(nv)=>setStart(s=>({...s,[k]:nv}))} step={k.includes("lat")?0.1:(k.includes("ips")||k.includes("gbs"))?0.1:1} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-4 bg-white shadow-sm">
              <h2 className="font-medium mb-2">Целевая нагрузка <span className="text-zinc-400">({task.metricsHint})</span></h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(end).map(([k,v])=> (
                  <NumberField key={k} label={k} value={Number(v)} onChange={(nv)=>setEnd(s=>({...s,[k]:nv}))} step={k.includes("lat")?0.1:(k.includes("ips")||k.includes("gbs"))?0.1:1} />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border p-4 bg-white shadow-sm">
              <h2 className="font-medium mb-2">Базовый класс узла (старт → цель)</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border p-3">
                  <h3 className="text-sm text-zinc-500">Старт</h3>
                  <div className="text-lg font-semibold">{plan.baseStart.name}</div>
                  <ul className="mt-2 list-disc pl-5">
                    <li>{plan.baseStart.cpu}</li>
                    <li>{plan.baseStart.ram}</li>
                    <li>{plan.baseStart.pcie}</li>
                    <li>{plan.baseStart.storage}</li>
                    <li>{plan.baseStart.network}</li>
                  </ul>
                </div>
                <div className="rounded-xl border p-3">
                  <h3 className="text-sm text-zinc-500">Цель</h3>
                  <div className="text-lg font-semibold">{plan.baseEnd.name}</div>
                  <ul className="mt-2 list-disc pl-5">
                    <li>{plan.baseEnd.cpu}</li>
                    <li>{plan.baseEnd.ram}</li>
                    <li>{plan.baseEnd.pcie}</li>
                    <li>{plan.baseEnd.storage}</li>
                    <li>{plan.baseEnd.network}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-4 bg-white shadow-sm">
              <h2 className="font-medium mb-2">Конфигурации узлов для сравнения</h2>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                {plan.start.map(v => (
                  <div key={"s-"+v.tier} className="rounded-xl border p-3">
                    <div className="text-xs uppercase text-zinc-500">Start — {v.tier}</div>
                    <div className="font-semibold">{v.nodeClass}</div>
                    <ul className="mt-2 list-disc pl-5">
                      <li>CPU: {v.cpu}</li>
                      <li>RAM: {v.ram}</li>
                      <li>Storage: {v.storage}</li>
                      <li>Network: {v.network}</li>
                      <li>SAN/FC: {v.san_fc}</li>
                    </ul>
                  </div>
                ))}
                {plan.end.map(v => (
                  <div key={"e-"+v.tier} className="rounded-xl border p-3">
                    <div className="text-xs uppercase text-zinc-500">Target — {v.tier}</div>
                    <div className="font-semibold">{v.nodeClass}</div>
                    <ul className="mt-2 list-disc pl-5">
                      <li>CPU: {v.cpu}</li>
                      <li>RAM: {v.ram}</li>
                      <li>Storage: {v.storage}</li>
                      <li>Network: {v.network}</li>
                      <li>SAN/FC: {v.san_fc}</li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-4 bg-white shadow-sm">
              <h2 className="font-medium mb-2">План масштабирования</h2>
              <p className="text-sm">Стартовые узлы: <b>{plan.startNodes}</b> → Целевые узлы: <b>{plan.endNodes}</b>.</p>
              <p className="text-sm">{plan.scale}</p>
              <p className="text-xs text-zinc-500 mt-2">Примечание: числа — ориентиры под современное 5–6 поколение CPU (Xeon 6 / EPYC 9005). Точные значения зависят от SKU и СХД.</p>
            </div>

            <footer className="text-xs text-zinc-400 pt-1">Эвристики для предпрод-планирования; валидируйте под фактические профили SAN/HCI/СУБД.</footer>
          </div>
        </section>
      </div>
    </div>
  );
}