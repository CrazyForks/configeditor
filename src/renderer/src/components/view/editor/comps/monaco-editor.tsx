
import { appSettingsAtom, newTextContentAtom, nowFilePathAtom, textContentAtom } from '@/components/view/editor/store'
import Editor, { loader } from '@monaco-editor/react'
import { useAtom } from 'jotai'
import * as monaco from "monaco-editor"
import { WelcomeFragment } from './welcome-fragment'
import { useEffect } from 'react'
const { ipcRenderer } = window.require('electron')
loader.config({ monaco });

export function MonacoEditor() {
    const [nowFilePath] = useAtom(nowFilePathAtom)
    const [textContent, setTextContent] = useAtom(textContentAtom);
    const [, setNewTextContent] = useAtom(newTextContentAtom);
    const [appSettings] = useAtom(appSettingsAtom);

    useEffect(() => {
        if (nowFilePath) {
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
    }, [nowFilePath])

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
            }}
        /> : <WelcomeFragment />}
    </div>
}
