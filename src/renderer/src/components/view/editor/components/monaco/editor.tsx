import { appSettingsAtom, downloadProgressAtom, downloadSpeedAtom, downloadStatusAtom, isFileLoadingAtom, newTextContentAtom, nowFileExtAtom, nowFileInfoAtom, nowFilePathAtom, textContentAtom } from '@/components/view/editor/store'
import Editor, { loader } from '@monaco-editor/react'
import { useAtom } from 'jotai'
import * as monaco from "monaco-editor"
import { useEffect, useRef } from 'react'
import { WelcomeFragment } from '../welcome-fragment'
import { getLanguageFromFilePath, registerApacheLanguage, registerNginxLanguage } from './languages'
import { MonacoLoading } from './loading'
import { peekViewManager, usePeekView } from './peekView'
import './peekview.css'
import { useLoadFile } from './useLoadFile'

loader.config({ monaco });
registerNginxLanguage(monaco);
registerApacheLanguage(monaco);

export function MonacoEditor() {
    const [nowFilePath] = useAtom(nowFilePathAtom)
    const [nowFileInfo] = useAtom(nowFileInfoAtom)
    const [nowFileExt] = useAtom(nowFileExtAtom)
    const [textContent] = useAtom(textContentAtom);
    const [newTextContent, setNewTextContent] = useAtom(newTextContentAtom);
    const [appSettings] = useAtom(appSettingsAtom);
    const [isFileLoading] = useAtom(isFileLoadingAtom);
    const [downloadProgress] = useAtom(downloadProgressAtom);
    const [downloadSpeed] = useAtom(downloadSpeedAtom);
    const [downloadStatus] = useAtom(downloadStatusAtom);
    
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    useLoadFile();
    usePeekView({
        nowFilePath,
        textContent,
        editorRef
    });

    // 根据文件路径和扩展名获取语言类型
    const editorLanguage = nowFilePath ? getLanguageFromFilePath(nowFilePath, nowFileExt) : 'plaintext'

    // 当编辑器挂载时注册 diff 功能
    const onEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
        editorRef.current = editor
        
        // 注册 diff 功能
        if (nowFilePath && textContent) {
            peekViewManager.registerEditor(editor, textContent, nowFilePath)
        }
    }

    // 当内容变化时更新 diff
    const onEditorChange = (content: string | undefined) => {
        const newContent = content ?? ''
        setNewTextContent(newContent)
        
        // 更新 diff 显示
        if (nowFilePath && editorRef.current) {
            peekViewManager.updateDiff(nowFilePath)
        }
    }

    return <div className='w-full' style={{height: 'calc(100% - 65px)'}}>
        {/* Text Editor */}
        {nowFilePath ? (
            isFileLoading ? (
                <MonacoLoading
                    downloadStatus={downloadStatus}
                    downloadProgress={downloadProgress}
                    downloadSpeed={downloadSpeed}
                    hasRemoteInfo={!!nowFileInfo?.remoteInfo}
                />
            ) : (
                <Editor
                    defaultLanguage=""
                    defaultValue=""
                    value={newTextContent}
                    onChange={onEditorChange}
                    onMount={onEditorMount}
                    language={editorLanguage}
                    options={{
                        fontSize: appSettings.fontSize,
                        automaticLayout: true,
                        wordWrap: appSettings.wordWrap ? 'on' : 'off',
                        lineNumbers: appSettings.lineNumbers ? 'on' : 'off',
                        theme: appSettings.theme,
                        glyphMargin: true, // 启用字形边距以显示 diff 装饰器
                    }}
                />
            )
        ) : (
            <WelcomeFragment />
        )}
    </div>
}
