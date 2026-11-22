// Vite: la herramienta que compila y levanta el proyecto. Aquí solo se activa el plugin de React.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Plugin que permite usar JSX (el HTML dentro de JavaScript) en los archivos .jsx
  plugins: [react()],
})
