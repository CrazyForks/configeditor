import React from 'react'
import ReactDOM from 'react-dom/client'
import './global.css'
import App from './App'
import { ThemeProvider } from './components/ui/theme-provider'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="configeditor-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
