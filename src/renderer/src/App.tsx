import ConfigEditor from '@/components/view/editor'
import { Toaster } from "@/components/ui/sonner"
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
const { ipcRenderer } = window.require('electron')

function App(): JSX.Element {
  const [updateInfo, setUpdateInfo] = useState<{version: string} | null>(null)

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

    // 监听主进程的更新事件
    ipcRenderer?.on?.('update-downloaded', (_event, info) => {
      setUpdateInfo(info)
    })

    // 检查是否已下载更新（主进程会在启动时主动推送）
    // ...无需手动请求，主进程已自动推送...

    return () => {
      ipcRenderer?.removeAllListeners?.('update-downloaded')
    }
  }, [])

  const handleRestart = () => {
    ipcRenderer?.invoke?.('quit-and-install')
  }

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
      {/* 升级弹窗 */}
      <Dialog open={!!updateInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发现新版本</DialogTitle>
          </DialogHeader>
          <div>新版本 {updateInfo?.version} 已下载，是否立即重启升级？</div>
          <DialogFooter>
            <button className="btn btn-primary" onClick={handleRestart}>重启升级</button>
            <button className="btn" onClick={() => setUpdateInfo(null)}>稍后</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
