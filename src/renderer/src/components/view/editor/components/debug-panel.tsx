import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isDebugPanelOpenAtom, debugLogsAtom, clearDebugLogsAtom } from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import {
    X,
    Trash2,
    Terminal,
    ChevronDown,
    ChevronUp
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

    if (!isDebugPanelOpen) {
        return null
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
                            {debugLogs.map((log, index) => (
                                <div
                                    key={index}
                                    className="text-xs font-mono text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 transition-colors"
                                >
                                    {log}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            )}
        </div>
    )
}
