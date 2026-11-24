// PUNTO DE ENTRADA de la aplicación: es lo primero que se ejecuta.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
// Estilos globales
import './global.css'
import { initTema } from './lib/tema'
import { initTexto } from './lib/texto'

// Aplica el tema guardado (modo claro/oscuro y paleta de colores)
initTema()
// Aplica el tamaño de letra guardado
initTexto()


// Le dice a React que dibuje <App /> dentro del <div id="root"> del index.html
createRoot(document.getElementById('root')).render(
  // StrictMode ayuda a detectar errores mientras se programa (no afecta al usuario final)
  <StrictMode>
    <App />
  </StrictMode>,
)
