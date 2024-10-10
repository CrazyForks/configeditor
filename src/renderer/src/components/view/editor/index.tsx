'use client'

import { newTextContentAtom, nowFilePathAtom, textContentAtom } from '@/lib/store'
import Editor, { loader } from '@monaco-editor/react'
import { useAtom } from 'jotai'
import * as monaco from "monaco-editor"
import { useEffect } from 'react'
import { EditorHeadBar } from './comps/editor-headbar'
import { FileSidebar } from './comps/file-sidebar'
import { WelcomeFragment } from './comps/welcome-fragment'
import { useInit } from './hooks'
const { ipcRenderer } = window.require('electron')
loader.config({ monaco });

export default function ConfigEditor() {
  const [nowFilePath] = useAtom(nowFilePathAtom)
  const [textContent, setTextContent] = useAtom(textContentAtom);
  const [, setNewTextContent] = useAtom(newTextContentAtom);
  useInit();

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

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 text-sm font-sans">
      <FileSidebar />
      {/* Right Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        <EditorHeadBar />
        {/* Text Editor */}
        {nowFilePath ? (
          <>
            <div className="flex-1 bg-gray-50 flex">
              <Editor
                defaultLanguage=""
                defaultValue=""
                value={textContent}
                onChange={onEditorChange}
                language='bash'
                options={{
                  fontSize: 14 // 设置字号为14px
                }}
              />
            </div>
          </>
        ) : (
          <>
            {/* Welcome Page */}
            <WelcomeFragment />
          </>
        )}
      </div>
    </div>
  )
}
