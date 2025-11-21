import React from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  return (<div style={padding:16}>
    <h1>Expert SPA</h1>
    <p>Static SPA shell (Object Storage deploy).</p>
    <ul>
      <li><a href="#" onClick={(e)=>e.preventDefault()}>Articles</a></li>
      <li><a href="#" onClick={(e)=>e.preventDefault()}>Demo flow</a></li>
    </ul>
  </div>)
}

createRoot(document.getElementById('root')).render(<App/>)
