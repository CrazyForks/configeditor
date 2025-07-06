
import { appSettingsAtom, newTextContentAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom } from '@/components/view/editor/store'
import Editor, { loader } from '@monaco-editor/react'
import { useAtom } from 'jotai'
import * as monaco from "monaco-editor"
import { WelcomeFragment } from './welcome-fragment'
import { useEffect } from 'react'
import { toast } from "sonner"
const { ipcRenderer } = window.require('electron')
loader.config({ monaco });

export function MonacoEditor() {
    const [nowFilePath] = useAtom(nowFilePathAtom)
    const [nowFileInfo] = useAtom(nowFileInfoAtom)
    const [textContent, setTextContent] = useAtom(textContentAtom);
    const [, setNewTextContent] = useAtom(newTextContentAtom);
    const [appSettings] = useAtom(appSettingsAtom);

    useEffect(() => {
        if (nowFilePath && nowFileInfo) {
            // 检查是否为远程文件
            if (nowFileInfo.remoteInfo) {
                // 远程文件，使用 SSH 读取
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
                    }
                }).catch((err) => {
                    toast(`连接远程服务器失败: ${err.message || '未知错误'}`)
                    setTextContent('')
                    setNewTextContent('')
                })
            } else {
                // 本地文件
                ipcRenderer.invoke('read-file-content', { filePath: nowFilePath }).then((arg) => {
                    const { content } = arg ?? {};
                    if (typeof content === 'string') {
                        setTextContent(content)
                        setNewTextContent(content)
                    } else {
                        setTextContent('')
                        setNewTextContent('')
                    }
                })
            }
        }
    }, [nowFilePath, nowFileInfo])

    const onEditorChange = (content: string | undefined) => {
        setNewTextContent(content ?? '')
    }

    return <div className='w-full' style={{height: 'calc(100% - 65px)'}}>
        {/* Text Editor */}
        {nowFilePath ? <Editor
            defaultLanguage=""
            defaultValue=""
            value={textContent}
            onChange={onEditorChange}
            language='bash'
            options={{
                fontSize: appSettings.fontSize, // 设置字号为14px
                automaticLayout: true,
                wordWrap: appSettings.wordWrap ? 'on' : 'off',
                lineNumbers: appSettings.lineNumbers ? 'on' : 'off',
                theme: appSettings.theme,
            }}
        /> : <WelcomeFragment />}
    </div>
}
