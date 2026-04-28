import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './design/tokens.css'

// Self-hosted fonts (charter: local-first, no external content shipping).
// Variable fonts cover the full weight axis in one file each.
import '@fontsource-variable/inter'
import '@fontsource-variable/lora'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource/caveat/400.css'
import '@fontsource/caveat/700.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
