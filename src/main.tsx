import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SessionProvider } from './auth'
import { ProfileProvider } from './store'
import './tailwind.css'
import './styles.css'
import './marketing.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <ProfileProvider>
          <App />
        </ProfileProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
