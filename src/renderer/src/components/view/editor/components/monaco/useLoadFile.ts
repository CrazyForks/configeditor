import { addDebugLogAtom, downloadProgressAtom, downloadSpeedAtom, downloadStatusAtom, isFileLoadingAtom, newTextContentAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom } from '@/components/view/editor/store'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { toast } from "sonner"
const { ipcRenderer } = window.require('electron')

export function useLoadFile() {
    const [nowFilePath] = useAtom(nowFilePathAtom)
    const [nowFileInfo] = useAtom(nowFileInfoAtom)
    const [, setTextContent] = useAtom(textContentAtom);
    const [, setNewTextContent] = useAtom(newTextContentAtom);
    const [, setIsFileLoading] = useAtom(isFileLoadingAtom);
    const [, setDownloadProgress] = useAtom(downloadProgressAtom);
    const [, setDownloadSpeed] = useAtom(downloadSpeedAtom);
    const [, setDownloadStatus] = useAtom(downloadStatusAtom);
    const [, addDebugLog] = useAtom(addDebugLogAtom);

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
                        setTextContent(content);
                        setNewTextContent(content);
                    } else {
                        toast(`读取远程文件失败: ${msg || '未知错误'}`)
                        setTextContent('');
                        setNewTextContent('');
                        setDownloadStatus('读取失败')
                    }
                }).catch((err) => {
                    toast(`连接远程服务器失败: ${err.message || '未知错误'}`)
                    setTextContent('');
                    setNewTextContent('');
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
                        console.log('读取本地文件内容:', content)
                        setTextContent(content);
                        setNewTextContent(content);
                    } else {
                        setTextContent('');
                        setNewTextContent('');
                    }
                }).finally(() => {
                    setIsFileLoading(false)
                })
            }
        } else {
            setIsFileLoading(false)
            setTextContent('');
            setNewTextContent('');
        }
    }, [nowFilePath, nowFileInfo])
}
