
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Verifica que en index.html tengas <div id="root"></div>
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('No se encontró el elemento root en el HTML')
}

createRoot(rootElement).render(
  
    <App />

)
