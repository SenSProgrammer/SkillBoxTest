import React, { useState } from 'react'
import pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'

// безопасная инициализация VFS под разные сборки
;(pdfMake as any).vfs = (pdfFonts as any)?.pdfMake?.vfs ?? (pdfFonts as any)?.vfs ?? {}
console.log('[pdfmake] vfs initialized:', Boolean((pdfMake as any).vfs))

export default function App() {
  const [username, setU] = useState('user1')
  const [password, setP] = useState('p1')
  const [me, setMe] = useState<any>(null)
  const [hex1, setH1] = useState('䷀')
  const [hex2, setH2] = useState('䷁')
  const [question, setQ] = useState('К чему готовиться в текущем лунном цикле?')
  const [answer, setAns] = useState('')
  const [status, setStatus] = useState<string>('')

  async function login() {
    try {
      setStatus('Логин...')
      const u = username.trim()
      const p = password.trim()
      if (!u || !p) return setStatus('Введите логин и пароль')

      const resp = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: u, password: p })
      })
      if (!resp.ok) {
        const t = await resp.text().catch(()=>'')
        setStatus(`Логин неуспешен (${resp.status}). ${t}`)
        return
      }
      const meResp = await fetch('/auth/me', { credentials: 'include' })
      setMe(await meResp.json())
      setStatus('Готово')
    } catch (e: any) {
      setStatus(`Ошибка логина: ${e?.message || e}`)
    }
  }

  async function logout() {
    try {
      setStatus('Выход...')
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
      setMe(null)
      setStatus('Вышли')
    } catch (e: any) { setStatus(`Ошибка выхода: ${e?.message || e}`) }
  }

  async function pingMe() {
    try {
      setStatus('Запрос /auth/me...')
      const meResp = await fetch('/auth/me', { credentials: 'include' })
      setMe(await meResp.json())
      setStatus('Профиль обновлён')
    } catch (e: any) { setStatus(`Ошибка /me: ${e?.message || e}`) }
  }

  async function interpret() {
    try {
      if (!me?.sensid) return setStatus('Сначала войдите')
      setStatus('Интерпретация...')
      const r = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensid: me.sensid, hex1, hex2, question })
      })
      const data = await r.json()
      setAns(data.text || '')
      setStatus('Готово')
    } catch (e: any) { setStatus(`Ошибка интерпретации: ${e?.message || e}`) }
  }

  function savePdf() {
    if (me?.subscription?.level < 1) { alert('Нужна подписка уровня 1+'); return }
    const docDefinition = {
      content: [
        { text: 'Ицзин — интерпретация', fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
        { text: `Вопрос: ${question}`, margin: [0, 0, 0, 6] },
        { text: `Гексаграммы: ${hex1} → ${hex2}`, margin: [0, 0, 0, 10] },
        { text: answer || '', margin: [0, 0, 0, 0] },
      ],
      defaultStyle: { font: 'Roboto', fontSize: 11 },
    } as any
    pdfMake.createPdf(docDefinition).download('iching-interpretation.pdf')
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>SENS — демо интерпретации Ицзин</h1>

      <div style={{ marginBottom: 12, color: '#555' }}>
        <b>Статус:</b> {status || '—'}
      </div>

      <section style={{ border: '1px solid #ddd', padding: 16, borderRadius: 12 }}>
        <h3>Логин</h3>
        <input placeholder='username' autoComplete='username'
               value={username} onChange={e => setU(e.target.value)} />
        <input placeholder='password' type='password' autoComplete='current-password'
               value={password} onChange={e => setP(e.target.value)} />
        <button type="button" onClick={login} style={{ marginLeft: 8 }}>Войти</button>
        <button type="button" onClick={logout} style={{ marginLeft: 8 }}>Выйти</button>
        <button type="button" onClick={pingMe} style={{ marginLeft: 8 }}>Профиль (/me)</button>
        <pre style={{ whiteSpace:'pre-wrap', marginTop: 8 }}>
{me ? JSON.stringify(me, null, 2) : 'не авторизован'}
        </pre>
      </section>

      <section style={{ border: '1px solid #ddd', padding: 16, borderRadius: 12, marginTop: 16 }}>
        <h3>Запрос</h3>
        <input value={hex1} onChange={e => setH1(e.target.value)} /> → <input value={hex2} onChange={e => setH2(e.target.value)} />
        <textarea rows={3} style={{ width: '100%' }} value={question} onChange={e => setQ(e.target.value)} />
        <button type="button" onClick={interpret}>Интерпретировать</button>
        <button type="button" onClick={savePdf} style={{ marginLeft: 8 }}>Сохранить PDF (только 1+)</button>
        <pre style={{ whiteSpace:'pre-wrap' }}>{answer}</pre>
      </section>
    </div>
  )
}