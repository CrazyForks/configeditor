import ConfigEditor from '@/components/view/editor'
import { Toaster } from "@/components/ui/sonner"
import { useEffect } from 'react'

function App(): JSX.Element {
  useEffect(() => {
    // 确保主题系统正确初始化
    const theme = localStorage.getItem('configeditor-theme') || 'system'
    const root = window.document.documentElement
    
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [])

  return (
    <div className="fixed w-screen h-screen overflow-hidden bg-background text-foreground">
      <ConfigEditor />
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'heroui-card shadow-heroui-lg',
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          }
        }}
      />
    </div>
  )
}

export default App
