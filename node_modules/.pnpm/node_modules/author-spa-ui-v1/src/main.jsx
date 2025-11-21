import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'

const API = (path) => `http://localhost:8787${path}`

async function getRC(rcId) {
  const res = await fetch(API(`/ext/rc/export-json?rc_id=${encodeURIComponent(rcId)}`), { credentials: 'include' })
  if (!res.ok) throw new Error('RC not found')
  return await res.json()
}
async function postAlignments(pairs) {
  const res = await fetch(API('/ext/cross/alignments'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
    body: JSON.stringify({ pairs })
  })
  return await res.json()
}
async function arbitrate(rcA, rcB) {
  const res = await fetch(API('/ext/cross/arbitrate'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
    body: JSON.stringify({ rc_a_id: rcA, rc_b_id: rcB })
  })
  return await res.json()
}
async function getArbResult(arbId) {
  const res = await fetch(API(`/ext/cross/arbitrations/${arbId}/result`), { credentials: 'include' })
  return await res.json()
}

function ThesesList({ title, theses, selected, onPick }) {
  return (
    <div className="col">
      <h3 style={{marginTop:0}}>{title}</h3>
      <div className="grid">
        {(theses || []).sort((a,b)=>a.order-b.order).map(t => (
          <div key={t.thesis_uid} className={"thesis" + (selected===t.thesis_uid ? " sel": "")} onClick={()=>onPick?.(t.thesis_uid)}>
            <div className="badge">#{t.order}</div>
            <div style={{marginTop:6,whiteSpace:'pre-wrap'}}>{t.text_md}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function App(){
  const [rcA, setRcA] = useState('')
  const [rcB, setRcB] = useState('')
  const [a, setA] = useState(null)
  const [b, setB] = useState(null)
  const [err, setErr] = useState('')
  const [pairs, setPairs] = useState([])
  const [label, setLabel] = useState('agree100')
  const [arb, setArb] = useState(null)
  const [result, setResult] = useState(null)
  const [merged, setMerged] = useState(null)
  const [selA, setSelA] = useState(null)
  const [selB, setSelB] = useState(null)

  const loadA = async ()=>{ setErr(''); try{ setA(await getRC(rcA)) }catch(e){ setErr(String(e)) } }
  const loadB = async ()=>{ setErr(''); try{ setB(await getRC(rcB)) }catch(e){ setErr(String(e)) } }
  const addPair = ()=>{ if(!selA||!selB) return; setPairs([...pairs, { thesis_uid_a: selA, thesis_uid_b: selB, label_by_a: label, label_by_b: label }]); setSelA(null); setSelB(null); }
  const sendPairs = async ()=>{ setErr(''); try{ await postAlignments(pairs) }catch(e){ setErr(String(e)) } }
  const runArb = async ()=>{
    setErr('')
    try{
      const r = await arbitrate(rcA, rcB); setArb(r)
      const rr = await getArbResult(r.id); setResult(rr)
      if(rr.merged_rc_id){ const man = await getRC(rr.merged_rc_id); setMerged(man) }
    }catch(e){ setErr(String(e)) }
  }

  return (
    <div className="wrap">
      <h1>LiveBook — Author UI (Minimal)</h1>
      <div className="row">
        <div className="col">
          <div>RC_A</div>
          <input value={rcA} onChange={e=>setRcA(e.target.value)} placeholder="rc_..." style={{width:'100%'}}/>
          <div style={{height:8}}/>
          <button onClick={loadA} disabled={!rcA}>Загрузить A</button>
        </div>
        <div className="col">
          <div>RC_B</div>
          <input value={rcB} onChange={e=>setRcB(e.target.value)} placeholder="rc_..." style={{width:'100%'}}/>
          <div style={{height:8}}/>
          <button onClick={loadB} disabled={!rcB}>Загрузить B</button>
        </div>
        <div className="col">
          <div>Метка соответствия</div>
          <select value={label} onChange={e=>setLabel(e.target.value)}>
            <option value="agree100">agree100</option>
            <option value="agree50">agree50</option>
            <option value="agree0">agree0</option>
            <option value="incorrect">incorrect</option>
          </select>
          <div style={{height:8}}/>
          <div className="btnRow">
            <button onClick={addPair} disabled={!selA||!selB}>Добавить пару</button>
            <button onClick={()=>setPairs([])} disabled={!pairs.length}>Очистить пары</button>
            <button onClick={sendPairs} disabled={!pairs.length}>Отправить соответствия</button>
            <button onClick={runArb} disabled={!rcA||!rcB}>Арбитраж ИИ</button>
          </div>
          <div className="note" style={{marginTop:8}}>Шаги: выберите тезис A, затем тезис B, установите метку и нажмите «Добавить пару». Потом «Отправить соответствия» и «Арбитраж ИИ».</div>
        </div>
      </div>

      {err && <div className="err" style={{marginTop:8}}>{err}</div>}

      <div style={{height:16}}/>

      <div className="row">
        <ThesesList title={a ? `A: ${a.article?.title}` : 'A (не загружено)'} theses={a?.theses} selected={selA} onPick={setSelA}/>
        <ThesesList title={b ? `B: ${b.article?.title}` : 'B (не загружено)'} theses={b?.theses} selected={selB} onPick={setSelB}/>
      </div>

      <div style={{height:16}}/>

      <div className="col">
        <h3 style={{marginTop:0}}>Пары к отправке ({pairs.length})</h3>
        {!pairs.length && <div className="note">ещё нет пар</div>}
        <ul className="pairs">
          {pairs.map((p,idx)=>(
            <li key={idx}><span className="badge">A</span> {p.thesis_uid_a} ↔ <span className="badge">B</span> {p.thesis_uid_b} — <b>{p.label_by_a}</b></li>
          ))}
        </ul>
      </div>

      {result && (
        <div className="col" style={{marginTop:16}}>
          <h3 style={{marginTop:0}}>Arbitration Result</h3>
          <div className="note">arb_id: {arb?.id} | merged_rc_id: {result.merged_rc_id}</div>
          <div style={{overflowX:'auto'}}>
            <table className="mapping">
              <thead><tr><th>merged_thesis_uid</th><th>role</th><th>sources</th></tr></thead>
              <tbody>
                {(result.mapping||[]).map((m)=> (
                  <tr key={m.merged_thesis_uid}>
                    <td><code>{m.merged_thesis_uid}</code></td>
                    <td>{m.role}</td>
                    <td>{(m.from||[]).map(s=>`${s.rc_id}:${s.thesis_uid}`).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {merged && (
        <div className="col" style={{marginTop:16}}>
          <h3 style={{marginTop:0}}>Merged RC — Theses</h3>
          <div className="grid">
            {merged.theses?.map(t => (
              <div key={t.thesis_uid} className="thesis">
                <div className="badge">#{t.order}</div>
                <div style={{marginTop:6}}>
                  <div className="note">role: {t.merge_role || '-'}</div>
                  <div className="note">sources: {(t.provenance?.sources||[]).map(s=>`${s.rc_id}:${s.thesis_uid}`).join(', ')}</div>
                </div>
                <div style={{marginTop:6,whiteSpace:'pre-wrap'}}>{t.text_md}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{height:24}}/>
      <div className="note">Backend base URL: http://localhost:8787 — замените при деплое.</div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App/>)