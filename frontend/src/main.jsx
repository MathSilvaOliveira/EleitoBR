import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TemaProvider }    from './context/TemaProvider.jsx'
import { FiltrosProvider } from './context/FiltrosProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TemaProvider>
      <FiltrosProvider>
        <App />
      </FiltrosProvider>
    </TemaProvider>
  </StrictMode>,
)