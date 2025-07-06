import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isDebugPanelOpenAtom, debugLogsAtom, clearDebugLogsAtom, type DebugLogType } from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import {
    X,
    Trash2,
    Terminal,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle,
    AlertCircle,
    Info
} from 'lucide-react'
import { useState, useRef, useCallback } from 'react'

export function DebugPanel() {
    const [isDebugPanelOpen, setIsDebugPanelOpen] = useAtom(isDebugPanelOpenAtom)
    const [debugLogs] = useAtom(debugLogsAtom)
    const [, clearDebugLogs] = useAtom(clearDebugLogsAtom)
    const [isMinimized, setIsMinimized] = useState(false)
    const [panelHeight, setPanelHeight] = useState(256) // 默认高度 h-64 = 256px
    const [isDragging, setIsDragging] = useState(false)
    const dragStartY = useRef(0)
    const dragStartHeight = useRef(0)

    // 获取日志类型对应的样式和图标
    const getLogStyle = (type: DebugLogType) => {
        switch (type) {
            case 'success':
                return {
                    bgColor: 'bg-green-50 border-green-200 hover:bg-green-100',
                    textColor: 'text-green-800',
                    icon: <CheckCircle className="h-3 w-3 text-green-500" />
                }
            case 'error':
                return {
                    bgColor: 'bg-red-50 border-red-200 hover:bg-red-100',
                    textColor: 'text-red-800',
                    icon: <XCircle className="h-3 w-3 text-red-500" />
                }
            case 'warning':
                return {
                    bgColor: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
                    textColor: 'text-yellow-800',
                    icon: <AlertCircle className="h-3 w-3 text-yellow-500" />
                }
            case 'info':
            default:
                return {
                    bgColor: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
                    textColor: 'text-gray-700',
                    icon: <Info className="h-3 w-3 text-gray-500" />
                }
        }
    }

    const onClose = () => {
        setIsDebugPanelOpen(false)
    }

    const onClear = () => {
        clearDebugLogs()
    }

    const onToggleMinimize = () => {
        setIsMinimized(!isMinimized)
    }

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        dragStartY.current = e.clientY
        dragStartHeight.current = panelHeight
        
        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = dragStartY.current - e.clientY
            const newHeight = Math.max(48, Math.min(600, dragStartHeight.current + deltaY)) // 最小48px，最大600px
            setPanelHeight(newHeight)
            
            // 如果高度小于等于48px，自动最小化
            if (newHeight <= 48) {
                setIsMinimized(true)
            } else {
                setIsMinimized(false)
            }
        }
        
        const handleMouseUp = () => {
            setIsDragging(false)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
        
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [panelHeight])

    if (!isDebugPanelOpen) {
        return null
    }

    return (
        <div 
            className={`fixed bottom-0 left-0 right-0 bg-white text-gray-900 border-t border-gray-200 shadow-2xl transition-all duration-300 z-50 rounded-t-xl ${
                isDragging ? 'transition-none' : ''
            }`}
            style={{ height: isMinimized ? '48px' : `${panelHeight}px` }}
        >
            {/* Header */}
            <div 
                className={`flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-xl cursor-ns-resize select-none ${
                    isDragging ? 'bg-gray-100' : ''
                }`}
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center space-x-3 pointer-events-none">
                    <Terminal className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">输出</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {debugLogs.length} 条消息
                    </span>
                </div>
                <div className="flex items-center space-x-1 pointer-events-auto">
                    <Button
                        onClick={onToggleMinimize}
                        size="sm"
                        variant="ghost"
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-8 w-8 p-0 rounded-lg transition-colors"
                        title={isMinimized ? "展开" : "最小化"}
                    >
                        {isMinimized ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        onClick={onClear}
                        size="sm"
                        variant="ghost"
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-8 w-8 p-0 rounded-lg transition-colors"
                        title="清空日志"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={onClose}
                        size="sm"
                        variant="ghost"
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-8 w-8 p-0 rounded-lg transition-colors"
                        title="关闭"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <ScrollArea style={{ height: `${panelHeight - 48}px` }} className="p-4">
                    {debugLogs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            暂无日志输出
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {debugLogs.map((log) => {
                                const style = getLogStyle(log.type)
                                return (
                                    <div
                                        key={log.id}
                                        className={`text-xs font-mono px-3 py-2 rounded-lg border transition-colors flex items-start gap-2 ${style.bgColor} ${style.textColor}`}
                                    >
                                        <div className="flex-shrink-0 mt-0.5">
                                            {style.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs opacity-60">[{log.timestamp}]</span>
                                                <span className="text-xs font-semibold uppercase opacity-80">
                                                    {log.type}
                                                </span>
                                            </div>
                                            <div className="break-words">
                                                {log.message}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            )}
        </div>
    )
}
