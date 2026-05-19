import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../IncentiveStackCalculator.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
