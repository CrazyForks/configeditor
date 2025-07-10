import { Progress } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'

interface MonacoLoadingProps {
  downloadStatus?: string
  downloadProgress?: number
  downloadSpeed?: string
  hasRemoteInfo?: boolean
}

export function MonacoLoading({
  downloadStatus,
  downloadProgress = 0,
  downloadSpeed,
  hasRemoteInfo = false
}: MonacoLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 px-8 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
      </div>
      
      {/* 状态文本 */}
      <p className="text-sm mb-2 text-center">
        {downloadStatus || '正在加载文件内容...'}
      </p>
      
      {/* 只在远程文件且有进度时显示进度条 */}
      {hasRemoteInfo && downloadProgress > 0 && (
        <div className="w-full space-y-2">
          <Progress value={downloadProgress} className="w-full h-2" />
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>{Math.round(downloadProgress)}%</span>
            {downloadSpeed && <span>{downloadSpeed}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
