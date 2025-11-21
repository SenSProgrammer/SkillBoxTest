import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import jsPDF from 'jspdf'

function App() {
  const [username, setU] = useState('user1')
  const [password, setP] = useState('p1')
  const [me, setMe] = useState<any>(null)
  const [hex1, setH1] = useState('䷀')
  const [hex2, setH2] = useState('䷁')
  const [question, setQ] = useState('К чему готовиться в текущем лунном цикле?')
  const [answer, setAns] = useState('')

  async function login() {
    await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    })
    const meResp = await fetch('/auth/me', { credentials: 'include' })
    setMe(await meResp.json())
  }

  async function interpret() {
    if (!me?.sensid) return alert('Сначала войдите')
    const r = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sensid: me.sensid, hex1, hex2, question })
    })
    const data = await r.json()
    setAns(data.text || '')
  }

  function savePdf() {
    if (me?.subscription?.level < 1) {
      alert('Нужна подписка уровня 1+')
      return
    }
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Ицзин — интерпретация', 14, 18)
    doc.setFontSize(11)
    doc.text(`Вопрос: ${question}`, 14, 28)
    doc.text(`Гексаграммы: ${hex1} → ${hex2}`, 14, 36)
    doc.text(answer || '', 14, 46, { maxWidth: 180 })
    doc.save('iching-interpretation.pdf')
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>SENS — демо интерпретации Ицзин</h1>

      <section style={{ border: '1px solid #ddd', padding: 16, borderRadius: 12 }}>
        <h3>Логин</h3>
        <input placeholder='username' value={username} onChange={e=>setU(e.target.value)} />
        <input placeholder='password' type='password' value={password} onChange={e=>setP(e.target.value)} />
        <button onClick={login}>Войти</button>
        <pre style={{ whiteSpace:'pre-wrap' }}>{me ? JSON.stringify(me, null, 2) : 'не авторизован'}</pre>
      </section>

      <section style={{ border: '1px solid #ddd', padding: 16, borderRadius: 12, marginTop: 16 }}>
        <h3>Запрос</h3>
        <input value={hex1} onChange={e=>setH1(e.target.value)} /> → <input value={hex2} onChange={e=>setH2(e.target.value)} />
        <textarea rows={3} style={{ width: '100%' }} value={question} onChange={e=>setQ(e.target.value)} />
        <button onClick={interpret}>Интерпретировать</button>
        <button onClick={savePdf} style={{ marginLeft: 8 }}>Сохранить PDF (только 1+)</button>
        <pre style={{ whiteSpace:'pre-wrap' }}>{answer}</pre>
      </section>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
