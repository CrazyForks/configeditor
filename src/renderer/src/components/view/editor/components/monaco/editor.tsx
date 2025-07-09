
import { appSettingsAtom, newTextContentAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom, nowFileExtAtom, isFileLoadingAtom, downloadProgressAtom, downloadSpeedAtom, downloadStatusAtom, addDebugLogAtom } from '@/components/view/editor/store'
import Editor, { loader } from '@monaco-editor/react'
import { useAtom } from 'jotai'
import * as monaco from "monaco-editor"
import { WelcomeFragment } from '../welcome-fragment'
import { useEffect } from 'react'
import { toast } from "sonner"
import { Loader2, Download } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { computeDirtyDiff } from './diff'
import { generateDecorations } from './decorations'
import { getLanguageFromFilePath, registerApacheLanguage, registerNginxLanguage } from './languages'
const { ipcRenderer } = window.require('electron')
loader.config({ monaco });
registerNginxLanguage(monaco);
registerApacheLanguage(monaco);

export function MonacoEditor() {
    const [nowFilePath] = useAtom(nowFilePathAtom)
    const [nowFileInfo] = useAtom(nowFileInfoAtom)
    const [nowFileExt] = useAtom(nowFileExtAtom)
    const [textContent, setTextContent] = useAtom(textContentAtom);
    const [, setNewTextContent] = useAtom(newTextContentAtom);
    const [appSettings] = useAtom(appSettingsAtom);
    const [isFileLoading, setIsFileLoading] = useAtom(isFileLoadingAtom);
    const [downloadProgress, setDownloadProgress] = useAtom(downloadProgressAtom);
    const [downloadSpeed, setDownloadSpeed] = useAtom(downloadSpeedAtom);
    const [downloadStatus, setDownloadStatus] = useAtom(downloadStatusAtom);
    const [, addDebugLog] = useAtom(addDebugLogAtom);

    // 根据文件路径和扩展名获取语言类型
    const editorLanguage = nowFilePath ? getLanguageFromFilePath(nowFilePath, nowFileExt) : 'plaintext'

    useEffect(() => {
        if (nowFilePath && nowFileInfo) {
            // 检查是否为远程文件
            if (nowFileInfo.remoteInfo) {
                // 远程文件，使用 SSH 读取
                setIsFileLoading(true)
                setDownloadProgress(0)
                setDownloadSpeed('')
                setDownloadStatus('正在初始化连接...')
                
                // 监听下载进度
                const handleDownloadProgress = (_, data) => {
                    const { progress, status, speed } = data
                    setDownloadProgress(progress)
                    setDownloadStatus(status)
                    setDownloadSpeed(speed)
                }
                
                // 监听调试日志
                const handleDebugLog = (_, data) => {
                    const { message, type } = data
                    addDebugLog(message, type)
                }
                
                ipcRenderer.on('download-progress', handleDownloadProgress)
                ipcRenderer.on('debug-log', handleDebugLog)
                
                ipcRenderer.invoke('read-remote-file-content', { 
                    filePath: nowFilePath,
                    remoteInfo: nowFileInfo.remoteInfo 
                }).then((arg) => {
                    const { content, code, msg } = arg ?? {};
                    
                    if (code === 3 && typeof content === 'string') {
                        setTextContent(content)
                        setNewTextContent(content)
                    } else {
                        toast(`读取远程文件失败: ${msg || '未知错误'}`)
                        setTextContent('')
                        setNewTextContent('')
                        setDownloadStatus('读取失败')
                    }
                }).catch((err) => {
                    toast(`连接远程服务器失败: ${err.message || '未知错误'}`)
                    setTextContent('')
                    setNewTextContent('')
                    setDownloadStatus('连接失败')
                }).finally(() => {
                    // 移除监听器
                    ipcRenderer.removeListener('download-progress', handleDownloadProgress)
                    ipcRenderer.removeListener('debug-log', handleDebugLog)
                    
                    setTimeout(() => {
                        setIsFileLoading(false)
                        setDownloadProgress(0)
                        setDownloadSpeed('')
                        setDownloadStatus('')
                    }, 1500) // 1.5秒后清除进度显示
                })
            } else {
                // 本地文件
                setIsFileLoading(true)
                ipcRenderer.invoke('read-file-content', { filePath: nowFilePath }).then((arg) => {
                    const { content } = arg ?? {};
                    if (typeof content === 'string') {
                        setTextContent(content)
                        setNewTextContent(content)
                    } else {
                        setTextContent('')
                        setNewTextContent('')
                    }
                }).finally(() => {
                    setIsFileLoading(false)
                })
            }
        } else {
            setIsFileLoading(false)
        }
    }, [nowFilePath, nowFileInfo])

    const onEditorChange = (content: string | undefined) => {
        setNewTextContent(content ?? '')
    }

    return <div className='w-full' style={{height: 'calc(100% - 65px)'}}>
        {/* Text Editor */}
        {nowFilePath ? (
            isFileLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 px-8 max-w-md mx-auto">
                    <div className="flex items-center mb-4">
                        <Loader2 className="h-8 w-8 animate-spin mr-3" />
                    </div>
                    
                    {/* 状态文本 */}
                    <p className="text-sm mb-2 text-center">
                        {downloadStatus || '正在加载文件内容...'}
                    </p>
                    
                    {/* 只在远程文件且有进度时显示进度条 */}
                    {nowFileInfo?.remoteInfo && downloadProgress > 0 && (
                        <div className="w-full space-y-2">
                            <Progress value={downloadProgress} className="w-full h-2" />
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>{Math.round(downloadProgress)}%</span>
                                {downloadSpeed && <span>{downloadSpeed}</span>}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <Editor
                    defaultLanguage=""
                    defaultValue=""
                    value={textContent}
                    onChange={onEditorChange}
                    language={editorLanguage}
                    options={{
                        fontSize: appSettings.fontSize, // 设置字号为14px
                        automaticLayout: true,
                        wordWrap: appSettings.wordWrap ? 'on' : 'off',
                        lineNumbers: appSettings.lineNumbers ? 'on' : 'off',
                        theme: appSettings.theme,
                    }}
                />
            )
        ) : (
            <WelcomeFragment />
        )}
    </div>
}
