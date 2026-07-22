import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/create-room.css'
import './styles/ready-room.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

const syncVisibleViewportHeight = () => {
  const visibleHeight = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${Math.round(visibleHeight)}px`)
}

syncVisibleViewportHeight()
window.addEventListener('resize', syncVisibleViewportHeight)
window.addEventListener('orientationchange', syncVisibleViewportHeight)
window.visualViewport?.addEventListener('resize', syncVisibleViewportHeight)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
